import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SessionState } from '../../interfaces'
import {
  IBladeConnectResult,
  SessionAuthError,
  SessionStatus,
} from '../../../utils/interfaces'
import { destroyAction, authError } from '../../actions'

export const initialSessionState: Readonly<SessionState> = {
  protocol: '',
  iceServers: [],
  authStatus: 'unknown',
  authError: undefined,
  status: 'unknown',
}

const sessionSlice = createSlice({
  name: 'session',
  initialState: initialSessionState,
  reducers: {
    connected: (state, { payload }: PayloadAction<IBladeConnectResult>) => {
      state.authStatus = 'authorized'
      state.status = 'connected'
      state.protocol = payload?.result?.protocol ?? ''
      state.iceServers = payload?.result?.iceServers ?? []
    },
    socketStatusChange: (state, { payload }: PayloadAction<SessionStatus>) => {
      state.status = payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(destroyAction.type, () => {
      return initialSessionState
    })
    builder.addCase(
      authError.type,
      (state, { payload }: PayloadAction<{ error: SessionAuthError }>) => {
        state.authStatus = 'unauthorized'
        state.authError = payload.error
      }
    )
  },
})

// prettier-ignore
export const {
  actions: sessionActions,
  reducer: sessionReducer
} = sessionSlice
