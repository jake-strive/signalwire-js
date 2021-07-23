import { SagaIterator, Channel, eventChannel, EventChannel } from 'redux-saga'
import { call, put, take, fork, select } from 'redux-saga/effects'
import { PayloadAction } from '@reduxjs/toolkit'
import { BaseSession } from '../../../BaseSession'
import { VertoResult } from '../../../RPCMessages'
import {
  JSONRPCRequest,
  ConferenceWorkerParams,
  BladeBroadcastParams,
} from '../../../utils/interfaces'
import { ExecuteActionParams, WebRTCCall } from '../../interfaces'
import { executeAction, socketMessageAction } from '../../actions'
import { componentActions } from '../'
import { Execute } from '../../../RPCMessages'
import { logger } from '../../../utils'
import { getAuthStatus } from '../session/sessionSelectors'
import { SessionAuthStatus } from '../../../utils/interfaces'

type SessionSagaParams = {
  session: BaseSession
  sessionChannel: EventChannel<unknown>
  pubSubChannel: Channel<unknown>
}

type VertoWorkerParams = {
  jsonrpc: JSONRPCRequest
  nodeId: string
}

/**
 * Watch every "executeAction" and fork the worker to send
 * a JSONRPC over the wire and then update the state
 * with "componentActions.executeSuccess" or "componentActions.executeFailure"
 * actions if a componentId is provided.
 */
export function* executeActionWatcher(session: BaseSession): SagaIterator {
  function* worker(action: PayloadAction<ExecuteActionParams>): SagaIterator {
    const { componentId, requestId, method, params } = action.payload
    try {
      const message = Execute({
        id: requestId,
        method,
        params,
      })
      const response = yield call(session.execute, message)
      if (componentId && requestId) {
        yield put(
          componentActions.executeSuccess({
            componentId,
            requestId,
            response,
          })
        )
      }
    } catch (error) {
      logger.warn('worker error', componentId, error)
      if (componentId && requestId) {
        yield put(
          componentActions.executeFailure({
            componentId,
            requestId,
            action,
            error,
          })
        )
      }
    }
  }

  while (true) {
    const action = yield take(executeAction.type)
    const authStatus: SessionAuthStatus = yield select(getAuthStatus)

    if (authStatus === 'authorized') {
      yield fork(worker, action)
    }
  }
}

export function* sessionChannelWatcher({
  session,
  sessionChannel,
  pubSubChannel,
}: SessionSagaParams): SagaIterator {
  function* vertoWorker({ jsonrpc, nodeId }: VertoWorkerParams) {
    logger.debug('vertoWorker', jsonrpc, nodeId)
    const { id, method, params = {} } = jsonrpc

    switch (method) {
      case 'verto.media': {
        const component = {
          id: params.callID,
          state: 'early',
          remoteSDP: params.sdp,
          nodeId,
        }
        yield put(componentActions.upsert(component))
        yield put(
          executeAction({
            method: 'video.message',
            params: {
              message: VertoResult(id, method),
              node_id: nodeId,
            },
          })
        )
        break
      }
      case 'verto.answer': {
        const component: WebRTCCall = {
          id: params.callID,
          state: 'active',
          nodeId,
        }
        if (params?.sdp) {
          component.remoteSDP = params.sdp
        }
        yield put(componentActions.upsert(component))
        yield put(
          executeAction({
            method: 'video.message',
            params: {
              message: VertoResult(id, method),
              node_id: nodeId,
            },
          })
        )
        break
      }
      case 'verto.bye': {
        const component: WebRTCCall = {
          id: params.callID,
          state: 'hangup',
          nodeId,
          byeCause: params?.cause ?? '',
          byeCauseCode: params?.causeCode ?? 0,
          redirectDestination: params?.redirectDestination,
        }
        yield put(componentActions.upsert(component))
        yield put(
          executeAction({
            method: 'video.message',
            params: {
              message: VertoResult(id, method),
              node_id: nodeId,
            },
          })
        )
        break
      }
      case 'verto.ping':
        yield put(
          executeAction({
            method: 'video.message',
            params: {
              message: VertoResult(id, method),
              node_id: nodeId,
            },
          })
        )
        break
      case 'verto.punt':
        return session.disconnect()
      // case 'verto.invite':
      //   break
      // case 'verto.attach':
      //   break
      case 'verto.info':
        return logger.debug('Verto Info', params)
      case 'verto.clientReady':
        return logger.debug('Verto ClientReady', params)
      case 'verto.announce':
        return logger.debug('Verto Announce', params)
      default:
        return logger.debug(`Unknown Verto method: ${method}`, params)
    }
  }

  function* conferenceWorker(params: ConferenceWorkerParams) {
    logger.info(params.event_type, JSON.stringify(params, null, 2))
    switch (params.event_type) {
      case 'room.subscribed': {
        yield put(
          componentActions.upsert({
            id: params.params.call_id,
            roomId: params.params.room.room_id,
            roomSessionId: params.params.room.room_session_id,
            memberId: params.params.member_id,
          })
        )
        // Rename "room.subscribed" with "room.joined" for the end-user
        yield put(pubSubChannel, {
          type: 'room.joined',
          payload: params.params,
        })
        break
      }
      case 'member.updated': {
        const {
          member: { updated = [] },
        } = params.params
        for (const key of updated) {
          yield put(pubSubChannel, {
            type: `member.updated.${key}`,
            payload: params.params,
          })
        }
        break
      }
      case 'member.talking': {
        const { member } = params.params
        if ('talking' in member) {
          const suffix = member.talking ? 'start' : 'stop'
          yield put(pubSubChannel, {
            type: `member.talking.${suffix}`,
            payload: params.params,
          })
        }
        break
      }
    }

    // Emit on the pubSubChannel this "event_type"
    yield put(pubSubChannel, {
      type: params.event_type,
      payload: params.params,
    })
  }

  function* bladeBroadcastWorker(broadcastParams: BladeBroadcastParams) {
    // TODO: how to check protocol for each event ?
    // if (broadcastParams?.protocol !== session.relayProtocol) {
    //   return logger.error('Session protocol mismatch.')
    // }

    switch (broadcastParams.event_type) {
      case 'webrtc.message': {
        yield fork(vertoWorker, {
          jsonrpc: broadcastParams.params,
          nodeId: broadcastParams.node_id,
        })
        break
      }
      case 'room.subscribed':
      case 'member.updated':
      case 'member.joined':
      case 'member.left':
      case 'member.talking':
      case 'layout.changed': {
        logger.info(broadcastParams.event_type, broadcastParams.params)
        yield fork(conferenceWorker, broadcastParams)
        break
      }
      default: {
        if ('development' === process.env.NODE_ENV) {
          // @ts-expect-error
          throw new Error(`Unknown broadcast event: ${broadcastParams.event}`)
        }
        return logger.debug('Unknown broadcast event', broadcastParams)
      }
    }
  }

  function* sessionChannelWorker(
    action: PayloadAction<JSONRPCRequest>
  ): SagaIterator {
    logger.debug('Inbound WebSocket Message', action)
    if (action.type !== socketMessageAction.type) {
      yield put(action)
      return
    }
    const { method, params } = action.payload

    switch (method) {
      case 'signalwire.event':
        yield fork(bladeBroadcastWorker, params as BladeBroadcastParams)
        break
      default:
        return logger.debug(`Unknown message: ${method}`, action)
    }
  }

  /**
   * Make the watcher restartable
   */
  while (true) {
    try {
      while (true) {
        const action = yield take(sessionChannel)
        yield fork(sessionChannelWorker, action)
      }
    } catch (error) {
      logger.error('sessionChannelWorker error:', error)
    } finally {
      logger.warn('sessionChannelWorker finally')
    }
  }
}

export function createSessionChannel(session: BaseSession) {
  return eventChannel((emit) => {
    session.dispatch = (payload: PayloadAction<any>) => {
      emit(payload)
    }

    // this will be invoked when the saga calls `channel.close()` method
    const unsubscribe = () => {
      logger.debug('sessionChannel unsubscribe')
      session.disconnect()
    }

    return unsubscribe
  })
}
