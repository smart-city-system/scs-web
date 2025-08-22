"use client";
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

 const pcRef = useRef<RTCPeerConnection | null>(null);
 const videoRef = useRef<HTMLVideoElement | null>(null);
 // Use a ref to store candidates to avoid re-renders
 const candidatesRef = useRef<RTCIceCandidate[]>([]);
 // Use a ref to handle the promise resolution for ICE gathering
 const iceGatheringPromiseRef = useRef<(() => void) | null>(null);

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
  if (videoRef.current) {
   videoRef.current.srcObject = null;
  }
  candidatesRef.current = [];
  iceGatheringPromiseRef.current = null;
  setIsConnected(false);
 };

 const setupPeerConnection = () => {
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
    videoRef.current.play().catch((err) => log(`Video play failed: ${err.message}`));
   }
  };

  pc.onicecandidate = (event) => {
   if (event.candidate) {
    log(`New local ICE candidate: ${event.candidate.candidate}`);
    // Collect candidates here
    candidatesRef.current.push(event.candidate);
   }
  };

  // IMPORTANT: This event handler is now set up immediately.
  pc.onicegatheringstatechange = () => {
   log(`ICE gathering state: ${pc.iceGatheringState}`);
   if (pc.iceGatheringState === "complete") {
    // Resolve the promise when gathering is complete
    if (iceGatheringPromiseRef.current) {
     iceGatheringPromiseRef.current();
    }
   }
  };

  pc.onconnectionstatechange = () => {
   log(`Connection state: ${pc.connectionState}`);
   if (pc.connectionState === "connected") {
    updateStatus("WebRTC connection established", "success");
    setIsConnected(true);
   } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
    updateStatus("WebRTC connection failed or disconnected", "error");
    cleanup();
   }
  };
 };

 const joinStream = async () => {
  if (!cameraId || !viewerId) {
   updateStatus("Please enter both Camera ID and Viewer ID", "error");
   return;
  }

  updateStatus("Preparing to connect...", "info");
  cleanup();
  setupPeerConnection();

  const pc = pcRef.current;
  if (!pc) {
   updateStatus("Failed to create PeerConnection", "error");
   return;
  }

  try {
   log("Creating offer...");
   const offer = await pc.createOffer();
   await pc.setLocalDescription(offer);

   updateStatus("Waiting for ICE gathering to complete...", "info");

   // Correctly wait for ICE gathering to finish
   if (pc.iceGatheringState !== "complete") {
    await new Promise<void>((resolve) => {
     iceGatheringPromiseRef.current = resolve;
    });
   }

   log("ICE gathering complete. Sending offer to server.");
   
   const response = await fetch(
    `http://localhost:1325/api/v1/cameras/${cameraId}/join`,
    {
     method: "POST",
     headers: {
      "Content-Type": "application/json",
     },
     body: JSON.stringify({
      viewerId,
      offer: pc.localDescription,
      // Send all collected candidates at once
      candidates: candidatesRef.current,
     }),
    }
   );

   const data = await response.json();

   if (response.ok && data.answer) {
    log("Received answer from server. Setting remote description.");
    const answer = new RTCSessionDescription(data.answer);
    await pc.setRemoteDescription(answer);

    if (data.candidates && data.candidates.length > 0) {
     log(`Adding ${data.candidates.length} remote ICE candidates.`);
     for (const candidate of data.candidates) {
      await pc.addIceCandidate(candidate);
     }
    }
   } else {
    updateStatus("Failed to join stream: " + (data.error || "Unknown error"), "error");
    cleanup();
   }
  } catch (error: any) {
   updateStatus("Error during connection setup: " + error.message, "error");
   cleanup();
  }
 };

 const leaveStream = async () => {
  if (!isConnected) {
   updateStatus("Not connected to a stream.", "info");
   return;
  }
  log("Leaving stream...");
  cleanup();
  updateStatus("Disconnected from stream", "info");

  try {
   await fetch(`http://localhost:1325/api/v1/cameras/${cameraId}/leave`, {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({ viewerId }),
   });
  } catch (error) {
   log("Failed to send leave notification to server.");
  }
 };

 useEffect(() => {
  return () => cleanup();
 }, []);



  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h1>Stream Viewer Test</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <label>Camera ID:</label>
        <input value={cameraId} onChange={(e) => setCameraId(e.target.value)} />
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
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%" }}
      />
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
