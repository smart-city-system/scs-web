'use client'
import WebSocketRTCContext from '@/contexts/websocket-rtc-context'
import { useEffect, useRef, useState } from 'react'
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 2000 // 2 seconds
const CONNECTION_TIMEOUT = 5000 // 5 seconds

export function WebSocketRTCProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected')

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
    console.log(
      `🔄 Attempting RTC WebSocket connection (attempt ${retryCountRef.current + 1}/${MAX_RETRY_ATTEMPTS})`,
    )
    setConnectionStatus('connecting')

    try {
      // Try to connect with additional debugging
      const cameraUrl = process.env.NEXT_PUBLIC_CAMERA_ENDPOINT
      const websocket = new WebSocket(`ws://${cameraUrl?.slice(8)}/ws`)

      setWs(websocket)

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (websocket.readyState === WebSocket.CONNECTING) {
          console.error('⏰ WebSocket RTC connection timeout')
          websocket.close()
          handleConnectionFailure()
        }
      }, CONNECTION_TIMEOUT)

      websocket.onopen = () => {
        console.log('✅ WebSocket RTC connected successfully')
        setConnectionStatus('connected')
        retryCountRef.current = 0 // Reset retry count on successful connection

        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
      }

      // Add message handler to see what server sends
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
        } catch (error) {
          console.log('📨 Non-JSON RTC message:', event.data)
        }
      }

      websocket.onclose = (event) => {
        console.log('❌ WebSocket RTC disconnected - Code:', event.code, 'Reason:', event.reason)
        console.log('🔍 Close event details:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          type: event.type,
        })

        // Common close codes:
        // 1000 = Normal closure
        // 1001 = Going away
        // 1006 = Abnormal closure (no close frame)
        // 1011 = Server error
        // 1012 = Service restart

        setWs(null)
        setConnectionStatus('disconnected')

        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }

        // Only retry if it wasn't a manual close (code 1000)
        if (event.code !== 1000) {
          console.log('🔄 Connection closed unexpectedly, will retry...')
          handleConnectionFailure()
        } else {
          console.log('✅ Connection closed normally, no retry needed')
        }
      }

      websocket.onerror = (error) => {
        console.error('🚨 WebSocket RTC error:', error)
        setConnectionStatus('error')
        handleConnectionFailure()
      }

      return websocket
    } catch (error) {
      console.error('❌ Failed to create RTC WebSocket:', error)
      setConnectionStatus('error')
      handleConnectionFailure()
      return null
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    createConnection()

    // Cleanup function to close WebSocket on unmount
    return () => {
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
          console.log('🔌 Closing WebSocket RTC connection')
          ws.close(1000, 'Component unmounting')
        }
      }

      setWs(null)
      setConnectionStatus('disconnected')
    }
  }, [])

  return (
    <WebSocketRTCContext.Provider value={{ wsRTC: ws }}>{children}</WebSocketRTCContext.Provider>
  )
}

export default WebSocketRTCProvider
