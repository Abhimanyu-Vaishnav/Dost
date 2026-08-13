"use client";

import { useState, useEffect, useRef } from "react";
import { 
  PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, 
  RotateCcw, Sparkles, Shield, Minimize2, Maximize2 
} from "lucide-react";

interface CallModalProps {
  type: "voice" | "video";
  contact: {
    name: string;
    avatar: string;
    username: string;
  };
  onEndCall: () => void;
}

export function CallModal({ type, contact, onEndCall }: CallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callState, setCallState] = useState<"connecting" | "connected">("connecting");
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize Real Camera & Mic MediaStream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initMediaCall() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === "video",
          audio: true
        });
        activeStream = stream;
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera/Mic access error:", err);
      }
    }

    initMediaCall();

    const connectTimer = setTimeout(() => {
      setCallState("connected");
    }, 1200);

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [type]);

  // Handle Mute Toggle
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Handle Video Toggle
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
    }
  }, [isVideoEnabled]);

  const handleEndCallClick = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    onEndCall();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      backgroundColor: "rgba(0, 0, 0, 0.92)",
      backdropFilter: "blur(24px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "40px 24px"
    }} className="animate-fade-in">
      {/* Top Header info */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 2 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255, 255, 255, 0.12)", padding: "6px 16px",
          borderRadius: "9999px", color: "white", fontSize: "0.85rem", fontWeight: 800
        }}>
          <Shield size={16} style={{ color: "#10b981" }} /> End-to-End Encrypted Live {type === "voice" ? "Voice" : "Video"} Call
        </div>

        <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", margin: "10px 0 0 0" }}>
          {contact.name}
        </h2>
        <span style={{ fontSize: "0.95rem", color: "#10b981", fontWeight: 700 }}>
          {callState === "connecting" ? "Connecting..." : `Connected • ${formatTimer(callDuration)}`}
        </span>
      </div>

      {/* Center Visual Content */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: "100%",
        maxHeight: "520px",
        flex: 1
      }}>
        {type === "voice" ? (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Ripple Pulse Rings */}
            <div style={{
              position: "absolute", width: "190px", height: "190px", borderRadius: "50%",
              border: "3px solid rgba(29, 155, 240, 0.5)",
              animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
            }} />
            <div style={{
              position: "absolute", width: "240px", height: "240px", borderRadius: "50%",
              border: "2px solid rgba(168, 85, 247, 0.4)",
              animation: "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite"
            }} />

            <img
              src={contact.avatar}
              alt={contact.name}
              style={{
                width: "140px", height: "140px", borderRadius: "50%", objectFit: "cover",
                border: "4px solid var(--color-primary)", boxShadow: "0 10px 40px rgba(29, 155, 240, 0.6)",
                zIndex: 2
              }}
            />
          </div>
        ) : (
          /* Real Video Call Stream Container */
          <div style={{
            width: "100%", maxWidth: "640px", height: "100%", minHeight: "360px",
            borderRadius: "28px", overflow: "hidden", background: "#111111",
            position: "relative", border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
          }}>
            {/* Contact Remote Video Feed */}
            <img
              src={contact.avatar}
              alt={contact.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.9)" }}
            />

            {/* Real Camera Self-View Feed (PiP Badge) */}
            <div style={{
              position: "absolute", bottom: "20px", right: "20px",
              width: "120px", height: "160px", borderRadius: "18px",
              background: "#000", border: "2px solid rgba(255, 255, 255, 0.4)",
              overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
            }}>
              {isVideoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%", background: "#222",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.8rem"
                }}>
                  Cam Off
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div style={{
        display: "flex", alignItems: "center", gap: "24px",
        background: "rgba(255, 255, 255, 0.12)", padding: "16px 32px",
        borderRadius: "9999px", border: "1px solid rgba(255, 255, 255, 0.2)", zIndex: 2
      }}>
        {/* Mute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s ease"
          }}
          className="hover:scale-110"
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Video Toggle (for video call) or Speaker Toggle */}
        {type === "video" ? (
          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: !isVideoEnabled ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            className="hover:scale-110"
            title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
          >
            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        ) : (
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: isSpeakerOn ? "var(--color-primary)" : "rgba(255, 255, 255, 0.2)",
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            className="hover:scale-110"
            title="Toggle Speaker"
          >
            {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={handleEndCallClick}
          style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "#ef4444", color: "white", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 28px rgba(239, 68, 68, 0.6)"
          }}
          className="hover:scale-110"
          title="End Call"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}
