'use client'
import React, { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
}

export default function VideoPlayer({ stream, muted = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log("[VideoPlayer] Setting stream as srcObject:", stream);
      console.log("[VideoPlayer] Stream tracks:", stream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState,
        id: t.id
      })));

      videoRef.current.srcObject = stream;

      // Add event listeners for debugging
      const video = videoRef.current;

      const onLoadedMetadata = () => {
        console.log("[VideoPlayer] Video metadata loaded");
        console.log("[VideoPlayer] Video dimensions:", video.videoWidth, "x", video.videoHeight);
      };

      const onCanPlay = () => {
        console.log("[VideoPlayer] Video can play");
      };

      const onPlay = () => {
        console.log("[VideoPlayer] Video started playing");
      };

      const onError = (e: Event) => {
        console.error("[VideoPlayer] Video error:", e);
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('play', onPlay);
      video.addEventListener('error', onError);

      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('play', onPlay);
        video.removeEventListener('error', onError);
      };
    } else if (videoRef.current && !stream) {
      console.log("[VideoPlayer] No stream provided, clearing srcObject");
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      controls
      muted={muted}
      style={{ width: "100%", background: "#000" }}
    />
  );
}
