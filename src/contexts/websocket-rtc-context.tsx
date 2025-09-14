import { createContext } from 'react'

export interface WebSocketRTCContextType {
  // Define your context properties and methods here
  wsRTC: WebSocket | null
}
const WebSocketRTCContext = createContext<WebSocketRTCContextType | null>(null)
export default WebSocketRTCContext
