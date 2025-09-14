import { createContext } from 'react'
import type { WsMessage } from '@/types'

export interface WebSocketNotificationContextType {
  wsNotification: WebSocket | null
  lastMessage: WsMessage | null
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
}

const WebSocketNotificationContext = createContext<WebSocketNotificationContextType | null>(null)
export default WebSocketNotificationContext
