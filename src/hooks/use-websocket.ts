import type { WebSocketNotificationContextType } from '@/contexts/websocket-notification-context'
import WebSocketNotificationContext from '@/contexts/websocket-notification-context'
import { useContext } from 'react'

export function useWebsocketNotification(): WebSocketNotificationContextType | null {
  const wsContext = useContext<WebSocketNotificationContextType | null>(
    WebSocketNotificationContext,
  )
  if (!wsContext?.wsNotification) {
    // throw new Error('useWebsocket must be used within a WebSocketProvider.')
    return null
  }
  return wsContext
}
