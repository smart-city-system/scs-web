'use client'
import WebSocketContext from '@/contexts/websocket-notification-context'
import type { WsMessage } from '@/types'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

// Connection retry configuration
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 2000 // 2 seconds
const CONNECTION_TIMEOUT = 5000 // 5 seconds

export function WebSocketNotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected')
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const queryClient = useQueryClient()
  const handleConnectionFailure = () => {
    retryCountRef.current++

    if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
      console.log(
        `🔄 Retrying connection in ${RETRY_DELAY}ms (attempt ${
          retryCountRef.current + 1
        }/${MAX_RETRY_ATTEMPTS})`,
      )
      retryTimeoutRef.current = setTimeout(() => {
        createConnection()
      }, RETRY_DELAY)
    } else {
      console.error('❌ Max retry attempts reached. WebSocket connection failed.')
      setConnectionStatus('error')
    }
  }

  const createConnection = () => {
    const token = localStorage.getItem('sessionToken')
    if (!token) {
      console.warn('⚠️ No session token found, cannot establish WebSocket connection')
      setConnectionStatus('error')
      return
    }

    console.log(
      `🔄 Attempting WebSocket connection (attempt ${
        retryCountRef.current + 1
      }/${MAX_RETRY_ATTEMPTS})`,
    )
    setConnectionStatus('connecting')
    const notificationUrl = process.env.NEXT_PUBLIC_NOTIFICATION_ENDPOINT
    const websocket = new WebSocket(
      `ws://${notificationUrl?.slice(8)}/notifications?token=${token}`,
    )
    setWs(websocket)

    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (websocket.readyState === WebSocket.CONNECTING) {
        console.error('⏰ WebSocket connection timeout')
        websocket.close()
        handleConnectionFailure()
      }
    }, CONNECTION_TIMEOUT)

    websocket.onopen = () => {
      console.log('✅ WebSocket Notification connected')
      setConnectionStatus('connected')
      retryCountRef.current = 0 // Reset retry count on successful connection

      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
    }

    websocket.onmessage = (msg: MessageEvent) => {
      try {
        const data: WsMessage = JSON.parse(msg.data)

        // Update last message state
        setLastMessage(data)

        const event = data.event

        switch (event) {
          case 'notification':
            console.log('🔔 Notification received:', data)
            // Handle notification message
            break
          case 'alarm':
            console.log('🚨 Alarm received:', data)
            queryClient.invalidateQueries({ queryKey: ['alarms'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            break
          default:
            console.log(`❓ Unknown message event: ${event}`, data)
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
        console.error('❌ Raw message data:', msg.data)
      }
    }

    websocket.onclose = (event) => {
      console.log('❌ WebSocket Notification disconnected:', event.code, event.reason)
      setWs(null)
      setConnectionStatus('disconnected')

      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

      // Only retry if it wasn't a manual close (code 1000)
      if (event.code !== 1000) {
        handleConnectionFailure()
      }
    }

    websocket.onerror = (error) => {
      console.error('🚨 WebSocket Notification error:', error)
      setConnectionStatus('error')
      handleConnectionFailure()
    }

    return websocket
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    createConnection()

    // Cleanup function to close WebSocket on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket Notification Provider')

      // Clear any pending retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }

      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

      // Close WebSocket if open
      if (ws) {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          console.log('🔌 Closing WebSocket Notification connection')
          ws.close(1000, 'Component unmounting')
        }
      }

      setWs(null)
      setConnectionStatus('disconnected')
    }
  }, [])

  return (
    <WebSocketContext.Provider
      value={{
        wsNotification: ws,
        lastMessage,
        connectionStatus,
      }}
    >
      {/* Development-only connection status indicator */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 9999,
            backgroundColor:
              connectionStatus === 'connected' ? '#10b981' :
              connectionStatus === 'connecting' ? '#f59e0b' :
              connectionStatus === 'error' ? '#ef4444' : '#6b7280',
            color: 'white',
            cursor: connectionStatus === 'error' ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (connectionStatus === 'error') {
              retryCountRef.current = 0;
              createConnection();
            }
          }}
          title={connectionStatus === 'error' ? 'Click to retry connection' : ''}
        >
          WS: {connectionStatus.toUpperCase()}
          {connectionStatus === 'error' && ' (Click to retry)'}
        </div>
      )} */}
      {children}
    </WebSocketContext.Provider>
  )
}

export default WebSocketNotificationProvider
