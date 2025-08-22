'use client';
import React, { useEffect, useRef, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";

interface SignalingMessage {
  type: string;
  sdp?: SDP;
  role?: string;
  cameraId?: string;
  viewerId?: string;
  candidate?: IceCandidate;
}
interface SDP {
  type: string;
  sdp: string;
}
interface IceCandidate {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export default function Publisher() {
  const [cameraId, setCameraId] = useState("test-camera-1");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [iceStatus, setIceStatus] = useState("new");
  const [pcStatus, setPcStatus] = useState("new");
  const [candidatesSent, setCandidatesSent] = useState(0);
  const [candidatesReceived, setCandidatesReceived] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const initPublisher = async (camId: string) => {
    wsRef.current = new WebSocket("ws://localhost:1325/ws");

    wsRef.current.onopen = () => {
      setWsStatus("connected");
      console.log("[WS] Connected");
    };
    wsRef.current.onclose = () => {
      setWsStatus("disconnected");
      console.log("[WS] Disconnected");
    };

    wsRef.current.onmessage = async (msg: MessageEvent) => {
      const data: SignalingMessage = JSON.parse(msg.data);

      if (data.type === "answer" && data.sdp) {
        const desc = { type: "answer", sdp: data.sdp.sdp } as RTCSessionDescriptionInit;
        await pcRef.current?.setRemoteDescription(desc);
        console.log("[WebRTC] Set remote description with answer:", desc);
      } else if (data.type === "candidate" && data.candidate) {
        setCandidatesReceived((prev) => prev + 1);
        console.log("[WebRTC] Received ICE candidate:", data.candidate);
        await pcRef.current?.addIceCandidate({
          candidate: data.candidate.candidate,
          sdpMid: data.candidate.sdpMid,
          sdpMLineIndex: data.candidate.sdpMLineIndex
        });
      }
    };

    pcRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        setCandidatesSent((prev) => prev + 1);
        console.log("[WebRTC] Sending ICE candidate:", event.candidate);
        const msg: SignalingMessage = {
          type: "candidate",
          role: "publisher",
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || "0",
            sdpMLineIndex: event.candidate.sdpMLineIndex || 0
          },
          cameraId: camId
        };
        wsRef.current?.send(JSON.stringify(msg));
      }
    };

    pcRef.current.oniceconnectionstatechange = () => {
      const state = pcRef.current?.iceConnectionState || "unknown";
      setIceStatus(state);
      console.log("[WebRTC] ICE connection state:", state);
    };

    pcRef.current.onconnectionstatechange = () => {
      const state = pcRef.current?.connectionState || "unknown";
      setPcStatus(state);
      console.log("[WebRTC] Peer connection state:", state);
    };

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    setStream(localStream);
    localStream.getTracks().forEach((track) => {
      pcRef.current?.addTrack(track, localStream);
    });

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    const sendOffer = (offer: RTCSessionDescriptionInit) => {
      const msg: SignalingMessage = {
        type: "offer",
        role: "publisher",
        sdp: {
          type: offer.type,
          sdp: offer.sdp || ""
        },
        cameraId: camId
      };
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
      } else {
        wsRef.current!.onopen = () => {
          wsRef.current?.send(JSON.stringify(msg));
        };
      }
    };
    console.log("[WebRTC] Sending offer:", offer);
    sendOffer(offer);
  };

  const handleStartPublishing = () => {
    if (!cameraId.trim()) {
      alert("Please enter a Camera ID first.");
      return;
    }
    setIsPublishing(true);
    initPublisher(cameraId.trim());
  };

  return (
    <div>
      <h1>Publisher</h1>

      {!isPublishing && (
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Camera ID:{" "}
            <input
              type="text"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
            />
          </label>
          <button onClick={handleStartPublishing} style={{ marginLeft: "0.5rem" }}>
            Start Publishing
          </button>
        </div>
      )}

      {/* {isPublishing && <VideoPlayer stream={stream} muted />} */}

      <div style={{ marginTop: "1rem" }}>
        <p>WS Status: {wsStatus}</p>
        <p>ICE Status: {iceStatus}</p>
        <p>PC Status: {pcStatus}</p>
        <p>ICE Candidates Sent: {candidatesSent}</p>
        <p>ICE Candidates Received: {candidatesReceived}</p>
      </div>
    </div>
  );
}
