'use client'
import React, { useEffect, useRef, useState } from 'react'
import VideoPlayer from '../components/VideoPlayer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cameraService } from '@/services/cameraService'
import { useQuery } from '@tanstack/react-query'
import { Camera } from '@/types'
import { Button } from '@/components/ui/button'

interface SignalingMessage {
  type: string
  sdp?: SDP
  role?: string
  cameraId?: string
  viewerId?: string
  candidate?: IceCandidate
}
interface SDP {
  type: string
  sdp: string
}
interface IceCandidate {
  candidate: string
  sdpMid?: string
  sdpMLineIndex?: number
}

export default function Publisher() {
  const [cameraId, setCameraId] = useState('test-camera-1')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [wsStatus, setWsStatus] = useState('disconnected')
  const [iceStatus, setIceStatus] = useState('new')
  const [pcStatus, setPcStatus] = useState('new')
  const [candidatesSent, setCandidatesSent] = useState(0)
  const [candidatesReceived, setCandidatesReceived] = useState(0)
  const [isPublishing, setIsPublishing] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  const { data: cameras, isLoading: isLoadingCameras } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => {
      return cameraService.getAll({ page: 1, limit: 1000 })
    },
  })

  const initPublisher = async (camId: string) => {
    wsRef.current = new WebSocket('ws://localhost:1325/ws')

    wsRef.current.onopen = () => {
      setWsStatus('connected')
      console.log('[WS] Connected')
    }
    wsRef.current.onclose = () => {
      setWsStatus('disconnected')
      console.log('[WS] Disconnected')
    }

    wsRef.current.onmessage = async (msg: MessageEvent) => {
      const data: SignalingMessage = JSON.parse(msg.data)

      if (data.type === 'answer' && data.sdp) {
        const desc = { type: 'answer', sdp: data.sdp.sdp } as RTCSessionDescriptionInit
        await pcRef.current?.setRemoteDescription(desc)
        console.log('[WebRTC] Set remote description with answer:', desc)
      } else if (data.type === 'candidate' && data.candidate) {
        setCandidatesReceived((prev) => prev + 1)
        console.log('[WebRTC] Received ICE candidate:', data.candidate)
        await pcRef.current?.addIceCandidate({
          candidate: data.candidate.candidate,
          sdpMid: data.candidate.sdpMid,
          sdpMLineIndex: data.candidate.sdpMLineIndex,
        })
      }
    }

    pcRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        setCandidatesSent((prev) => prev + 1)
        console.log('[WebRTC] Sending ICE candidate:', event.candidate)
        const msg: SignalingMessage = {
          type: 'candidate',
          role: 'publisher',
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || '0',
            sdpMLineIndex: event.candidate.sdpMLineIndex || 0,
          },
          cameraId: camId,
        }
        wsRef.current?.send(JSON.stringify(msg))
      }
    }

    pcRef.current.oniceconnectionstatechange = () => {
      const state = pcRef.current?.iceConnectionState || 'unknown'
      setIceStatus(state)
      console.log('[WebRTC] ICE connection state:', state)
    }

    pcRef.current.onconnectionstatechange = () => {
      const state = pcRef.current?.connectionState || 'unknown'
      setPcStatus(state)
      console.log('[WebRTC] Peer connection state:', state)
    }

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    setStream(localStream)
    localStream.getTracks().forEach((track) => {
      pcRef.current?.addTrack(track, localStream)
    })

    const offer = await pcRef.current.createOffer()
    await pcRef.current.setLocalDescription(offer)

    const sendOffer = (offer: RTCSessionDescriptionInit) => {
      const msg: SignalingMessage = {
        type: 'offer',
        role: 'publisher',
        sdp: {
          type: offer.type,
          sdp: offer.sdp || '',
        },
        cameraId: camId,
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg))
      } else {
        wsRef.current!.onopen = () => {
          wsRef.current?.send(JSON.stringify(msg))
        }
      }
    }
    console.log('[WebRTC] Sending offer:', offer)
    sendOffer(offer)
  }

  const handleStartPublishing = () => {
    if (!cameraId.trim()) {
      alert('Please enter a Camera ID first.')
      return
    }
    setIsPublishing(true)
    initPublisher(cameraId.trim())
  }
  const cameraOptions = cameras
    ? cameras.data.map((camera) => ({
        label: camera.name,
        value: camera.id,
      }))
    : []
  return (
    <div>
      {!isPublishing && (
        <div style={{ marginBottom: '1rem' }} className="flex gap-2 justify-center mt-10">
          <Select onValueChange={(value) => setCameraId(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Camera" />
            </SelectTrigger>
            <SelectContent>
              {cameraOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleStartPublishing} style={{ marginLeft: '0.5rem' }}>
            Start Publishing
          </Button>
        </div>
      )}

      {/* {isPublishing && <VideoPlayer stream={stream} muted />} */}

      {/* <div style={{ marginTop: "1rem" }}>
        <p>WS Status: {wsStatus}</p>
        <p>ICE Status: {iceStatus}</p>
        <p>PC Status: {pcStatus}</p>
        <p>ICE Candidates Sent: {candidatesSent}</p>
        <p>ICE Candidates Received: {candidatesReceived}</p>
      </div> */}
    </div>
  )
}
