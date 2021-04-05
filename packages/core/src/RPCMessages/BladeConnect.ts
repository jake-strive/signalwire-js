import { makeRPCRequest } from './index'
import { BladeMethod } from '../utils/constants'

const BLADE_VERSION = {
  major: 2,
  minor: 5,
  revision: 0,
}

let agent: string = null
export const setAgentName = (name: string) => {
  agent = name
}

type WithToken = { token: string; jwt_token?: never }
type WithJWT = { token?: never; jwt_token: string }
type BladeConnectAuthentication = ({ project: string } & WithToken) | WithJWT
export type BladeConnectParams = {
  authentication: BladeConnectAuthentication
  params?: {
    protocol?: string
    contexts?: string[]
  }
}

export const BladeConnect = (params: BladeConnectParams) => {
  return makeRPCRequest({
    method: BladeMethod.Connect,
    params: {
      version: BLADE_VERSION,
      agent,
      ...params,
    },
  })
}
