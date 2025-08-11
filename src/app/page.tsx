'use client'
import React, { useRef, useState, useEffect } from 'react';

// Define interfaces for signaling messages
interface SignalingMessage {
  type: 'sdpOffer' | 'sdpAnswer' | 'iceCandidate';
  payload: any; // Payload will be the SDP object or ICE candidate object
  cameraId: string; // Identifier for the stream
}

// Main App component for WebRTC Publisher functionality
export default function App(): JSX.Element {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [cameraId, setCameraId] = useState<string>('');
  const [signalingStatus, setSignalingStatus] = useState<string>('Idle');
  const [isLocalStreamActive, setIsLocalStreamActive] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
  ];

  // --- WebSocket Connection Management ---
  useEffect(() => {
    // Establish WebSocket connection when component mounts
    setSignalingStatus('Connecting to signaling server...');
    const ws = new WebSocket('ws://localhost:1325/ws'); // Adjust URL if your backend is different

    ws.onopen = () => {
      console.log('WebSocket connected!');
      setSignalingStatus('Connected to signaling server.');
    };

    ws.onmessage = async (event: MessageEvent) => {
      try {
        const msg: SignalingMessage = JSON.parse(event.data);
        console.log('Received message:', msg);

        if (msg.cameraId !== cameraId && isPublishing) {
            console.warn('Received message for a different camera ID, ignoring:', msg.cameraId);
            return;
        }

        switch (msg.type) {
          case 'sdpAnswer':
            if (peerConnection && peerConnection.remoteDescription?.type !== 'answer') { // Avoid setting answer twice
                console.log('Setting remote description (answer):', msg.payload);
                const remoteSdp = new RTCSessionDescription(msg.payload);
                await peerConnection.setRemoteDescription(remoteSdp);
                setSignalingStatus('SDP Answer received and set.');
            }
            break;
          case 'iceCandidate':
            if (peerConnection && msg.payload) {
                console.log('Adding ICE candidate:', msg.payload);
                await peerConnection.addIceCandidate(new RTCIceCandidate(msg.payload));
                setSignalingStatus('ICE Candidate added.');
            }
            break;
          default:
            console.warn('Unknown signaling message type:', msg.type);
        }
      } catch (error) {
        console.error('Error parsing or handling WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected!');
      setSignalingStatus('Disconnected from signaling server.');
      setWebsocket(null); // Clear websocket state
      // Attempt to clean up WebRTC connection if WS closes unexpectedly
      if (peerConnection) {
          peerConnection.close();
          setPeerConnection(null);
      }
    };

    ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      setSignalingStatus('WebSocket error.');
    };

    setWebsocket(ws);

    // Cleanup function for useEffect
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [cameraId, peerConnection, isPublishing]); // Re-run effect if cameraId changes, to ensure fresh connection/handling

  // --- WebRTC Setup and Signaling Logic ---

  const getLocalStream = async (): Promise<MediaStream | null> => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsLocalStreamActive(true);
      return stream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      setSignalingStatus(`Error: ${error.message}`);
      return null;
    }
  };

  const startPublishing = async (): Promise<void> => {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      setSignalingStatus('WebSocket not connected. Please wait or refresh.');
      return;
    }
    if (!cameraId) {
      setSignalingStatus('Please enter a Camera ID.');
      return;
    }

    setIsPublishing(true);
    setSignalingStatus('Starting publisher WebRTC...');

    const localStream = await getLocalStream();
    if (!localStream) {
      setIsPublishing(false);
      return;
    }

    const pc: RTCPeerConnection = new RTCPeerConnection({ iceServers });
    setPeerConnection(pc); // Set here so onmessage can use it

    localStream.getTracks().forEach((track: MediaStreamTrack) => pc.addTrack(track, localStream));

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && websocket && websocket.readyState === WebSocket.OPEN) {
        console.log('Sending ICE candidate:', event.candidate);
        // Send ICE candidate over WebSocket
        websocket.send(JSON.stringify({
          type: 'iceCandidate',
          payload: event.candidate.toJSON(), // Convert RTCIceCandidate to JSON serializable object
          cameraId: cameraId,
        } as SignalingMessage));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Publisher PeerConnection state:', pc.connectionState);
      setSignalingStatus(`Publisher: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        console.log('Publisher connection closed or failed, cleaning up...');
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
          localVideoRef.current.srcObject = null;
        }
        setPeerConnection(null);
        setIsLocalStreamActive(false);
        setIsPublishing(false);
      }
    };

    try {
      const offer: RTCSessionDescriptionInit = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('Sending SDP offer:', offer);
      // Send SDP offer over WebSocket
      websocket.send(JSON.stringify({
        type: 'sdpOffer',
        payload: offer.toJSON(), // Convert RTCSessionDescriptionInit to JSON serializable object
        cameraId: cameraId,
      } as SignalingMessage));

      setSignalingStatus('SDP Offer sent, waiting for answer...');

    } catch (error: any) {
      console.error('Error starting publishing:', error);
      setSignalingStatus(`Publisher Error: ${error.message}`);
      if (pc) {
        pc.close();
      }
      setIsPublishing(false);
    }
  };

  // Cleanup effect when component unmounts or publishing stops
  useEffect(() => {
    return () => {
      if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
      }
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
      // Do NOT close WebSocket here, it's managed by its own useEffect
      setIsLocalStreamActive(false);
      setIsPublishing(false);
    };
  }, [peerConnection]); // Dependency array includes peerConnection to react to its changes

  const stopPublishing = () => {
    if (peerConnection) {
      peerConnection.close();
    }
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    setPeerConnection(null);
    setSignalingStatus('Idle');
    setIsLocalStreamActive(false);
    setIsPublishing(false);
    // Do not clear cameraId here, user might want to publish again with same ID
  };


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />

      <style jsx global>{`
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      <h1 className="text-4xl font-bold mb-8 text-gray-800 rounded-lg p-2 bg-white shadow-md">
        WebRTC Host Stream
      </h1>

      <div className="flex flex-col gap-8 w-full max-w-5xl mb-8">
        {/* Local Video Section (Host's Camera) */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Local Stream (Publishing)</h2>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto bg-gray-800 rounded-lg shadow-inner border border-gray-300"
          ></video>
          <p className="text-sm text-gray-500 mt-2">
            {isLocalStreamActive ? 'Your camera is active and ready for publishing.' : 'Camera not active.'}
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-3xl flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Host Controls</h2>

        <div className="w-full mb-4">
          <input
            type="text"
            placeholder="Enter Camera ID to publish (e.g., 'my-live-cam')"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={cameraId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCameraId(e.target.value)}
            disabled={isPublishing || !websocket || websocket.readyState !== WebSocket.OPEN}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={startPublishing}
            disabled={!cameraId || isPublishing || !websocket || websocket.readyState !== WebSocket.OPEN}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? 'Publishing...' : 'Start Publishing Stream'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
          <button
            onClick={stopPublishing}
            disabled={!isPublishing}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop Publishing
          </button>
        </div>
        
        <p className="text-lg text-gray-700 mt-4">
          Status: <span className="font-medium text-blue-800">{signalingStatus}</span>
        </p>
      </div>

      <p className="mt-8 text-sm text-gray-600 text-center">
        Enter a Camera ID and click "Start Publishing Stream" to broadcast your camera feed.
      </p>
    </div>
  );
}

