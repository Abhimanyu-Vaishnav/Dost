"use client";

import { useState, useEffect } from "react";
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

  // Call timer
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallState("connected");
    }, 1500);

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
    };
  }, []);

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
      backgroundColor: "rgba(0, 0, 0, 0.88)",
      backdropFilter: "blur(20px)",
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
          background: "rgba(255, 255, 255, 0.1)", padding: "4px 14px",
          borderRadius: "9999px", color: "white", fontSize: "0.8rem", fontWeight: 700
        }}>
          <Shield size={14} style={{ color: "#10b981" }} /> End-to-End Encrypted {type === "voice" ? "Voice" : "Video"} Call
        </div>

        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "white", margin: "8px 0 0 0" }}>
          {contact.name}
        </h2>
        <span style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
          {callState === "connecting" ? "Calling..." : formatTimer(callDuration)}
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
        maxHeight: "500px",
        flex: 1
      }}>
        {type === "voice" ? (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Ripple Pulse Rings */}
            <div style={{
              position: "absolute", width: "180px", height: "180px", borderRadius: "50%",
              border: "2px solid rgba(29, 155, 240, 0.4)",
              animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
            }} />
            <div style={{
              position: "absolute", width: "230px", height: "230px", borderRadius: "50%",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              animation: "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite"
            }} />

            <img
              src={contact.avatar}
              alt={contact.name}
              style={{
                width: "130px", height: "130px", borderRadius: "50%", objectFit: "cover",
                border: "4px solid var(--color-primary)", boxShadow: "0 10px 40px rgba(29, 155, 240, 0.5)",
                zIndex: 2
              }}
            />
          </div>
        ) : (
          /* Video Call Feed Container */
          <div style={{
            width: "100%", maxWidth: "600px", height: "100%", minHeight: "340px",
            borderRadius: "28px", overflow: "hidden", background: "#1a1a1a",
            position: "relative", border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}>
            {isVideoEnabled ? (
              <img
                src={contact.avatar}
                alt={contact.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.9)" }}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "white", fontWeight: 700 }}>
                Camera Off
              </div>
            )}

            {/* Self View (PiP Badge) */}
            <div style={{
              position: "absolute", bottom: "16px", right: "16px",
              width: "110px", height: "150px", borderRadius: "16px",
              background: "#2a2a2a", border: "2px solid rgba(255, 255, 255, 0.3)",
              overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
            }}>
              <div style={{
                width: "100%", height: "100%", background: "linear-gradient(135deg, #1d9bf0, #a855f7)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "0.8rem"
              }}>
                You
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div style={{
        display: "flex", alignItems: "center", gap: "20px",
        background: "rgba(255, 255, 255, 0.1)", padding: "14px 28px",
        borderRadius: "9999px", border: "1px solid rgba(255, 255, 255, 0.15)", zIndex: 2
      }}>
        {/* Mute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s ease"
          }}
          className="hover:scale-110"
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Video Toggle (for video call) or Speaker Toggle */}
        {type === "video" ? (
          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: !isVideoEnabled ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            className="hover:scale-110"
          >
            {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        ) : (
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: isSpeakerOn ? "var(--color-primary)" : "rgba(255, 255, 255, 0.2)",
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            className="hover:scale-110"
          >
            {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "#ef4444", color: "white", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(239, 68, 68, 0.5)"
          }}
          className="hover:scale-110"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  );
}
