import { BaseJWTSession } from '@signalwire/core'

export class JWTSession extends BaseJWTSession {
  // @ts-ignore
  public WebSocketConstructor = WebSocket
}
