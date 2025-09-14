import type { WebSocketRTCContextType } from '@/contexts/websocket-rtc-context'
import WebSocketContext from '@/contexts/websocket-notification-context'
import { useContext } from 'react'
import WebSocketRTCContext from '@/contexts/websocket-rtc-context'

export function useWebsocketRTC(): WebSocketRTCContextType | null {
  const wsContext = useContext<WebSocketRTCContextType | null>(WebSocketRTCContext)
  if (!wsContext?.wsRTC) {
    // throw new Error('useWebsocket must be used within a WebSocketProvider.')
    return null
  }
  return wsContext
}
