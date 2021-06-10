import { uuid, logger } from './utils'
import { Session } from './Session'
import { BaseJWTSession } from './BaseJWTSession'
import { configureStore, connect } from './redux'
import { SignalWire } from './SignalWire'
import { BaseComponent } from './BaseComponent'
import { EventEmitter, getEventEmitter } from './utils/EventEmitter'
import * as sessionSelectors from './redux/features/session/sessionSelectors'

// prettier-ignore
export {
  uuid,
  logger,
  Session,
  BaseJWTSession,
  BaseComponent,
  SignalWire,
  connect,
  configureStore,
  EventEmitter,
  getEventEmitter
}

export * from './RPCMessages'
export * from './utils/interfaces'
export { VertoMethod } from './utils/constants'
export * from './CustomErrors'

export const selectors = {
  ...sessionSelectors,
}
