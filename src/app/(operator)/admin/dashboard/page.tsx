'use client'
import { useAuth } from '@/hooks/use-auth'
import AlarmComponent from '../components/alarm'
import { useQuery } from '@tanstack/react-query'
import { premiseService } from '@/services/premiseService'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { cameraService } from '@/services/cameraService'
import { cn } from '@/lib/utils'
import { useWebsocketRTC } from '@/hooks/use-websocket-rtc'
import { ms } from 'zod/v4/locales'
import { alarmService } from '@/services/alarmService'
import AlarmDetail from './components/alarm-detail'
import type { Alarm } from '@/types'
import { useWebsocketNotification } from '@/hooks/use-websocket'

function DashboardPage() {
  const { user } = useAuth()
  const wsNotification = useWebsocketNotification()

  const [filters, setFilters] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 10,
  })
  const [isOpenAlarmDetail, setIsOpenAlarmDetail] = useState(false)
  const [selectedPremise, setSelectedPremise] = useState<string | null>(null)
  const [currentAlarm, setCurrentAlarm] = useState<Alarm | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    [key: string]: 'connecting' | 'connected' | 'failed' | 'disconnected'
  }>({})

  const { data: alarms, isLoading: isLoadingAlarms, error: alarmsError } = useQuery({
    queryKey: ['alarms'],
    queryFn: async () => {
      const result = await alarmService.getAlarms({ status: 'new' })
      return result
    },
  })

  useEffect(() => {
  }, [alarms, isLoadingAlarms, alarmsError])
  const { data: premises } = useQuery({
    queryKey: ['premises', filters.page],
    queryFn: () => {
      return premiseService.getAll({
        page: filters.page,
        limit: filters.limit,
      })
    },
  })
  const { data: cameras, isLoading: isLoadingCameras } = useQuery({
    queryKey: ['cameras', selectedPremise],
    queryFn: () => {
      return cameraService.getAll({
        premise_id: selectedPremise as string,
      })
    },
    enabled: !!premises,
  })
  const wsRTCValue = useWebsocketRTC()

  const pcsRef = useRef<{ [key: string]: RTCPeerConnection }>({})
  const videosRef = useRef<{ [key: string]: HTMLVideoElement }>({})

  const cleanupPeerConnections = useCallback(() => {
    for (const pc of Object.values(pcsRef.current)) {
      if (pc) {
        pc.close()
      }
    }
    pcsRef.current = {}

    // Clear video sources
    for (const video of Object.values(videosRef.current)) {
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream
        for (const track of stream.getTracks()) {
          track.stop()
        }
        video.srcObject = null
      }
    }
    videosRef.current = {}

    // Clear connection status
    setConnectionStatus({})
  }, [])

  const setupPeerConnection = useCallback(async (camId: string, viewId: string, ws: WebSocket) => {
    // Set connecting status
    setConnectionStatus((prev) => ({ ...prev, [camId]: 'connecting' }))

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })
    pcsRef.current = {
      ...pcsRef.current,
      [camId]: pc,
    }

    pc.addTransceiver('video', { direction: 'recvonly' })

    pc.ontrack = (event) => {
      console.log(`Received remote track: ${event.track.kind}`)
      const stream = new MediaStream([event.track])
      if (videosRef.current) {
        videosRef.current[camId].srcObject = stream
        videosRef.current[camId]
          .play()
          .then(() => {
            // Set connected status when video starts playing
            setConnectionStatus((prev) => ({ ...prev, [camId]: 'connected' }))
          })
          .catch((err) => {
            console.log(`Video play failed: ${err.message}`)
            setConnectionStatus((prev) => ({ ...prev, [camId]: 'failed' }))
          })
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        try {
          const candidateMessage = {
            type: 'candidate',
            role: 'viewer',
            cameraId: camId,
            viewerId: viewId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            },
          }
          console.log('📤 Sending ICE candidate:', candidateMessage)
          ws.send(JSON.stringify(candidateMessage))
        } catch (error) {
          console.error('❌ Failed to send ICE candidate:', error)
        }
      } else if (event.candidate) {
        console.warn('⚠️ WebSocket not ready, cannot send ICE candidate')
      }
    }

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${camId}: ${pc.connectionState}`)
      if (pc.connectionState === 'failed') {
        setConnectionStatus((prev) => ({ ...prev, [camId]: 'failed' }))
      } else if (pc.connectionState === 'disconnected') {
        setConnectionStatus((prev) => ({ ...prev, [camId]: 'disconnected' }))
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    // Check WebSocket state before sending offer
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const offerMessage = {
          type: 'offer',
          role: 'viewer',
          cameraId: camId,
          viewerId: viewId,
          sdp: {
            type: 'offer',
            sdp: offer.sdp,
          },
        }
        console.log('📤 Sending offer:', offerMessage)
        ws.send(JSON.stringify(offerMessage))
      } catch (error) {
        console.error('❌ Failed to send offer:', error)
      }
    } else {
      console.warn('⚠️ WebSocket not ready, cannot send offer. State:', ws.readyState)
    }
  }, [])

  useEffect(() => {
    if (premises && premises.data.length > 0) {
      setSelectedPremise(premises.data[0].id)
    }
  }, [premises])

  // Cleanup peer connections when premise changes
  useEffect(() => {
    if (selectedPremise) {
      cleanupPeerConnections()
    }
  }, [selectedPremise, cleanupPeerConnections])
  useEffect(() => {
    if (!wsRTCValue?.wsRTC) {
      return
    }

    const ws = wsRTCValue.wsRTC

    // Check if WebSocket is ready before setting up handlers
    if (ws.readyState !== WebSocket.OPEN) {
      return
    }

    const handleMessage = async (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data)

        if (msg.type === 'answer') {
          const answer = { type: 'answer', sdp: msg.sdp.sdp }
          await pcsRef.current[msg.cameraId].setRemoteDescription(answer as RTCSessionDescriptionInit)
          console.log('✅ Answer processed for camera:', msg.cameraId)
        }

        if (msg.type === 'candidate') {
          await pcsRef.current[msg.cameraId].addIceCandidate({
            candidate: msg.candidate.candidate,
            sdpMid: msg.candidate.sdpMid,
            sdpMLineIndex: msg.candidate.sdpMLineIndex,
          })
          console.log('✅ ICE candidate processed for camera:', msg.cameraId)
        }

        if (msg.type === 'error') {
          console.error('🚨 Server error:', msg.message)
        }
      } catch (error) {
        console.error('❌ Error processing RTC message:', error)
      }
    }

    const handleClose = () => {
      console.log('❌ RTC WebSocket connection closed in dashboard')
    }

    const handleError = (error: Event) => {
      console.error('🚨 RTC WebSocket error in dashboard:', error)
    }

    // Add event listeners instead of overriding
    ws.addEventListener('message', handleMessage)
    ws.addEventListener('close', handleClose)
    ws.addEventListener('error', handleError)

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up RTC WebSocket handlers')
      ws.removeEventListener('message', handleMessage)
      ws.removeEventListener('close', handleClose)
      ws.removeEventListener('error', handleError)
      cleanupPeerConnections()
    }
  }, [wsRTCValue, cleanupPeerConnections])


  useEffect(() => {
    if (wsRTCValue?.wsRTC && cameras && cameras.data.length > 0) {
      const ws = wsRTCValue.wsRTC

      // Check if WebSocket is ready
      if (ws.readyState !== WebSocket.OPEN) {
        console.log('⚠️ WebSocket not ready for peer connections, state:', ws.readyState)
        return
      }

      const activeCameras = cameras.data.filter((cam) => cam.is_active)
      if (activeCameras.length > 0) {
        for (const cam of activeCameras) {
          console.log('🎥 WebSocket ready, setting up peer connection for camera:', cam.name)
          setupPeerConnection(cam.id, user?.user_id as string, wsRTCValue.wsRTC)
        }
      }
    }
  }, [wsRTCValue, cameras, setupPeerConnection, user?.user_id])
  return (
    <>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-3">
          <div className="text-md m-3 font-semibold">Premises</div>
          {premises?.data.map((premise) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <div
              onClick={() => setSelectedPremise(premise.id)}
              key={premise.id}
              className={cn('mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded', {
                'bg-blue-100': selectedPremise === premise.id,
              })}
            >
              <div className="text-xs font-semibold">{premise.name}</div>
              <div className="text-xs  text-gray-600">{premise.address}</div>
            </div>
          ))}
        </div>
        <div className="col-span-6">
          <h2 className="mt-3 font-bold">Live cameras feed</h2>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {cameras?.data.map((camera) => (
              <div key={camera.id} className="border rounded-lg flex flex-col items-center">
                <div className="w-full h-60 bg-gray-200 flex flex-col items-center relative rounded-sm overflow-hidden">
                  {/* Camera name */}
                  <span className="absolute top-0 right-2 text-white z-10">{camera.name}</span>

                  {/* Loading/Status overlay */}
                  {connectionStatus[camera.id] === 'connecting' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                        <div className="text-sm">Connecting...</div>
                      </div>
                    </div>
                  )}

                  {connectionStatus[camera.id] === 'failed' && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center z-10">
                      <div className="text-white text-center">
                        <div className="text-sm">Connection Failed</div>
                      </div>
                    </div>
                  )}

                  {connectionStatus[camera.id] === 'disconnected' && (
                    <div className="absolute inset-0 bg-yellow-500 bg-opacity-50 flex items-center justify-center z-10">
                      <div className="text-white text-center">
                        <div className="text-sm">Disconnected</div>
                      </div>
                    </div>
                  )}

                  <video
                    ref={(el) => {
                      if (el) {
                        videosRef.current[camera.id] = el
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-3">
          <h2 className="mt-3 font-semibold">
            Alerts {alarms && `(${alarms.length})`}
            {isLoadingAlarms && ' - Loading...'}
          </h2>
          <div>
            {isLoadingAlarms && (
              <div className="mt-2 p-4 text-center text-gray-500">
                Loading alarms...
              </div>
            )}
            {alarmsError && (
              <div className="mt-2 p-4 text-center text-red-500">
                Error loading alarms: {alarmsError.message}
              </div>
            )}
            {alarms && alarms.length === 0 && !isLoadingAlarms && (
              <div className="mt-2 p-4 text-center text-gray-500">
                No alarms found
              </div>
            )}
            {alarms?.map((alarm, index) => {
              console.log('🎨 Rendering alarm:', alarm)
              return (
                <div className="mt-2" key={alarm.id || index}>
                  <AlarmComponent
                    severity={alarm.severity}
                    type={alarm.type}
                    description={alarm.description}
                    triggered_at={alarm.triggered_at}
                    device={alarm.device}
                    onClick={() => {
                      setCurrentAlarm(alarm)
                      setIsOpenAlarmDetail(true)
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <AlarmDetail
        open={isOpenAlarmDetail}
        onChange={() => setIsOpenAlarmDetail(false)}
        alarm={currentAlarm}
      />
    </>
  )
}

export default DashboardPage
