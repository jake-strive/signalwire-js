import { configureStore as rtConfigureStore } from '@reduxjs/toolkit'
import createSagaMiddleware, { channel, Saga, Task } from '@redux-saga/core'
import { rootReducer } from './rootReducer'
import rootSaga from './rootSaga'
import { PubSubChannel, SDKState } from './interfaces'
import { connect } from './connect'
import {
  InternalUserOptions,
  SessionConstructor,
  InternalChannels,
} from '../utils/interfaces'

export interface ConfigureStoreOptions {
  userOptions: InternalUserOptions
  SessionConstructor: SessionConstructor
  runSagaMiddleware?: boolean
  preloadedState?: Partial<SDKState>
}

export type SDKStore = ReturnType<typeof configureStore>
export type SDKRunSaga = <S extends Saga>(
  saga: S,
  params?: Parameters<S>[0]
) => Task

const configureStore = (options: ConfigureStoreOptions) => {
  const {
    userOptions,
    SessionConstructor,
    preloadedState = {},
    runSagaMiddleware = true,
  } = options
  const sagaMiddleware = createSagaMiddleware()
  const pubSubChannel: PubSubChannel = channel()
  /**
   * List of channels that are gonna be shared across all
   * sagas.
   */
  const channels: InternalChannels = {
    pubSubChannel,
  }
  const store = rtConfigureStore({
    devTools: userOptions?.devTools ?? true,
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      // It is preferrable to use the chainable .concat(...) and
      // .prepend(...) methods of the returned MiddlewareArray instead
      // of the array spread operator, as the latter can lose valuable
      // type information under some circumstances.
      // @see https://redux-toolkit.js.org/api/getDefaultMiddleware#intended-usage
      getDefaultMiddleware().concat(sagaMiddleware),
  })
  const runSaga: SDKRunSaga = (saga: Saga, args) => {
    return sagaMiddleware.run(saga, {
      ...args,
      channels,
    })
  }

  if (runSagaMiddleware) {
    const saga = rootSaga({
      SessionConstructor,
    })
    sagaMiddleware.run(saga, { userOptions, channels })
  }

  return {
    ...store,
    runSaga,
  }
}

export { connect, configureStore }
export * from './actions'
export * from './utils/sagaHelpers'
