'use client';
import React, { useRef, useState, useEffect } from "react";

type StatusType = "info" | "error" | "success";

export default function ViewerPage() {
  const [cameraId, setCameraId] = useState("test-camera-1");
  const [viewerId, setViewerId] = useState("viewer-1");
  const [status, setStatus] = useState<{ message: string; type: StatusType }>({
    message: "Ready to join stream",
    type: "info",
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;
    console.log(entry);
    setLogs((prev) => [...prev, entry]);
  };

  const updateStatus = (message: string, type: StatusType = "info") => {
    setStatus({ message, type });
    log(`Status: ${message}`);
  };

  const cleanup = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsConnected(false);
  };

  const setupPeerConnection = async (
    camId: string,
    viewId: string,
    ws: WebSocket
  ) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.addTransceiver("video", { direction: "recvonly" });

    pc.ontrack = (event) => {
      log(`Received remote track: ${event.track.kind}`);
      const stream = new MediaStream([event.track]);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .catch((err) => log(`Video play failed: ${err.message}`));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        log("Sending ICE candidate...");
        ws.send(
          JSON.stringify({
            type: "candidate",
            role: "viewer",
            cameraID: camId,
            viewerID: viewId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            },
          })
        );
      }
    };

    pc.onconnectionstatechange = () => {
      log(`Connection state: ${pc.connectionState}`);
      if (pc.connectionState === "failed") {
        updateStatus("Connection failed", "error");
        cleanup();
      }
    };

    log("Creating offer...");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);


    ws.send(
      JSON.stringify({
        type: "role",
        role: "viewer",
        viewerID: viewId,
      })
    );

    log("Sending viewer offer...");
    ws.send(
      JSON.stringify({
        type: "offer",
        role: "viewer",
        cameraID: camId,
        viewerID: viewId,
        sdp: {
          type: "offer",
          sdp: offer.sdp,
        },
      })
    );
  };

  const joinStream = () => {
    if (!cameraId || !viewerId) {
      updateStatus("Please enter both Camera ID and Viewer ID", "error");
      return;
    }
    updateStatus("Connecting to stream...", "info");

    const ws = new WebSocket("ws://localhost:1325/ws");
    wsRef.current = ws;

    ws.onopen = async () => {
      log("WebSocket connected");
      await setupPeerConnection(cameraId, viewerId, ws);
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      log(`Received: ${msg.type}`);

      if (msg.type === "answer") {
        log("Processing answer...");
        console.log("Received answer:", msg.sdp);
        const answer = { type: "answer", sdp: msg.sdp.sdp };
        await pcRef.current?.setRemoteDescription(answer as RTCSessionDescriptionInit);
        updateStatus("Connected to stream!", "success");
        setIsConnected(true);
      }

      if (msg.type === "candidate") {
        console.log("Adding ICE candidate:", msg.candidate);
        await pcRef.current?.addIceCandidate({
          candidate: msg.candidate.candidate,
          sdpMid: msg.candidate.sdpMid,
          sdpMLineIndex: msg.candidate.sdpMLineIndex,
        });
      }

      if (msg.type === "error") {
        updateStatus("Server error", "error");
        cleanup();
      }
    };

    ws.onerror = (err) => {
      log(`WebSocket error: ${err}`);
      updateStatus("WebSocket connection failed", "error");
      cleanup();
    };

    ws.onclose = () => {
      log("WebSocket disconnected");
      if (isConnected) {
        updateStatus("Connection lost", "error");
      }
      cleanup();
    };
  };

  const leaveStream = () => {
    log("Leaving stream...");
    cleanup();
    updateStatus("Disconnected from stream", "info");
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h1>Stream Viewer Test</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <label>Camera ID:</label>
        <input
          value={cameraId}
          onChange={(e) => setCameraId(e.target.value)}
        />
        <label>Viewer ID:</label>
        <input value={viewerId} onChange={(e) => setViewerId(e.target.value)} />
        <button onClick={joinStream} disabled={isConnected}>
          Join
        </button>
        <button onClick={leaveStream} disabled={!isConnected}>
          Leave
        </button>
      </div>
      <div
        style={{
          padding: 10,
          borderRadius: 4,
          marginBottom: 10,
          background:
            status.type === "success"
              ? "#d4edda"
              : status.type === "error"
              ? "#f8d7da"
              : "#d1ecf1",
        }}
      >
        {status.message}
      </div>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%" }} />
      <div
        style={{
          background: "#f8f9fa",
          border: "1px solid #dee2e6",
          padding: 10,
          height: 200,
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: 12,
          marginTop: 10,
        }}
      >
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
