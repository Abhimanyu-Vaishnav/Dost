"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from "lucide-react";

interface CallModalProps {
  conversationId: string;
  type: "AUDIO" | "VIDEO";
  recipientName: string;
  onClose: () => void;
}

export function CallModal({ conversationId, type, recipientName, onClose }: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === "AUDIO");
  const [callStatus, setCallStatus] = useState<"Ringing..." | "Connected" | "Ended">("Ringing...");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "VIDEO",
        });
        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Simulate connection
        setTimeout(() => {
          setCallStatus("Connected");
        }, 2000);

      } catch (err) {
        console.error("Camera/Mic access error:", err);
      }
    }

    startMedia();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [type]);

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => (track.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => (track.enabled = isVideoOff));
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    setCallStatus("Ended");
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setTimeout(onClose, 500);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(12px)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "#16181c", borderRadius: "24px", width: "100%", maxWidth: "540px",
        height: "640px", display: "flex", flexDirection: "column", overflow: "hidden",
        position: "relative", border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)"
      }}>
        {/* Remote Video Stream Container */}
        <div style={{ flex: 1, position: "relative", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {type === "VIDEO" && !isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "96px", height: "96px", borderRadius: "50%",
                background: "var(--color-primary)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "2.5rem", boxShadow: "0 0 30px rgba(29, 155, 240, 0.4)"
              }}>
                {recipientName.substring(0, 1).toUpperCase()}
              </div>
              <h2 style={{ color: "white", fontSize: "1.4rem", fontWeight: 800 }}>{recipientName}</h2>
              <span style={{ color: callStatus === "Connected" ? "#00ba7c" : "#1d9bf0", fontWeight: 700, fontSize: "1rem" }}>
                {callStatus}
              </span>
            </div>
          )}

          {/* Picture in Picture overlay */}
          {type === "VIDEO" && (
            <div style={{
              position: "absolute", top: "16px", right: "16px", width: "120px", height: "160px",
              borderRadius: "16px", overflow: "hidden", border: "2px solid rgba(255, 255, 255, 0.3)",
              background: "#000"
            }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div style={{
          padding: "24px", background: "#16181c", display: "flex",
          alignItems: "center", justifyContent: "center", gap: "24px"
        }}>
          <button
            onClick={toggleMute}
            style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: isMuted ? "#ff4d4d" : "rgba(255, 255, 255, 0.15)",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {type === "VIDEO" && (
            <button
              onClick={toggleVideo}
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: isVideoOff ? "#ff4d4d" : "rgba(255, 255, 255, 0.15)",
                color: "white", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}

          <button
            onClick={endCall}
            style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: "#f4212e", color: "white", display: "flex",
              alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(244, 33, 46, 0.5)"
            }}
          >
            <PhoneOff size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
