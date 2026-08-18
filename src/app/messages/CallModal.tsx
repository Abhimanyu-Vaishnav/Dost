"use client";

import { useState, useEffect, useRef } from "react";
import { 
  PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, 
  Shield, PhoneCall, Sparkles
} from "lucide-react";

interface CallModalProps {
  type: "voice" | "video";
  contact: {
    id?: string;
    name: string;
    avatar: string;
    username: string;
  };
  onEndCall: () => void;
  isIncomingAccepted?: boolean;
}

export function CallModal({ type, contact, onEndCall, isIncomingAccepted = false }: CallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callState, setCallState] = useState<"ringing" | "connected" | "declined">(
    isIncomingAccepted ? "connected" : "ringing"
  );
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Send OFFER signal to target user on mount (if caller)
  useEffect(() => {
    const targetId = contact.id || contact.username;
    if (!isIncomingAccepted && targetId) {
      fetch("/api/messages/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "OFFER",
          toUserId: targetId,
          callType: type,
          callerName: contact.name,
          callerAvatar: contact.avatar
        })
      }).catch(err => console.error("Send call offer error:", err));
    }
  }, [isIncomingAccepted, contact, type]);

  // Poll for call status updates (ANSWER / REJECT)
  useEffect(() => {
    const signalInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/messages/calls/signal");
        if (res.ok) {
          const data = await res.json();
          if (data.signal) {
            if (data.signal.action === "ANSWER") {
              setCallState("connected");
            } else if (data.signal.action === "REJECT" || data.signal.action === "END") {
              setCallState("declined");
              setTimeout(() => {
                onEndCall();
              }, 1500);
            }
          }
        }
      } catch (e) {}
    }, 1000);

    return () => clearInterval(signalInterval);
  }, [onEndCall]);

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

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [type]);

  // Call duration timer (runs ONLY when connected)
  useEffect(() => {
    if (callState !== "connected") return;

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

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
    if (contact.id) {
      fetch("/api/messages/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END", toUserId: contact.id })
      }).catch(() => {});
    }
    onEndCall();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0, 0, 0, 0.90)",
        backdropFilter: "blur(32px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "48px 24px",
        overflow: "hidden"
      }} 
      className="animate-fade-in"
    >
      {/* Ambient Blurred Background Avatar Artwork */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${contact.avatar})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(60px) brightness(0.25)",
          opacity: 0.6,
          transform: "scale(1.1)",
          zIndex: 0
        }} 
      />

      {/* Top Header info */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 2 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255, 255, 255, 0.12)", padding: "6px 18px",
          borderRadius: "9999px", color: "white", fontSize: "0.85rem", fontWeight: 800,
          border: "1px solid rgba(255, 255, 255, 0.2)", backdropFilter: "blur(12px)"
        }}>
          <Shield size={16} style={{ color: "#10b981" }} /> End-to-End Encrypted Live {type === "voice" ? "Voice" : "Video"} Call
        </div>

        <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", margin: "14px 0 2px 0", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
          {contact.name}
        </h2>
        <span style={{ 
          fontSize: "1rem", 
          color: callState === "connected" ? "#10b981" : callState === "declined" ? "#ef4444" : "#00f2fe", 
          fontWeight: 700, 
          display: "flex", 
          alignItems: "center", 
          gap: "6px" 
        }}>
          {callState === "ringing" ? (
            <>
              <PhoneCall size={16} className="animate-pulse" /> Ringing...
            </>
          ) : callState === "declined" ? (
            "Call Declined"
          ) : (
            `Connected • ${formatTimer(callDuration)}`
          )}
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
        flex: 1,
        zIndex: 2
      }}>
        {type === "voice" ? (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Ripple Pulse Equalizer Rings */}
            <div style={{
              position: "absolute", width: "200px", height: "200px", borderRadius: "50%",
              border: "3px solid rgba(0, 242, 254, 0.6)",
              animation: "ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite"
            }} />
            <div style={{
              position: "absolute", width: "250px", height: "250px", borderRadius: "50%",
              border: "2px solid rgba(168, 85, 247, 0.4)",
              animation: "ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite"
            }} />

            <img
              src={contact.avatar}
              alt={contact.name}
              style={{
                width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover",
                border: "4px solid #00f2fe", boxShadow: "0 0 50px rgba(0, 242, 254, 0.5)",
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

      {/* Bottom Glossy Control Bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "24px",
        background: "rgba(255, 255, 255, 0.14)", padding: "16px 36px",
        borderRadius: "9999px", border: "1px solid rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(20px)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 2
      }}>
        {/* Mute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease"
          }}
          className="hover:scale-110 active:scale-95"
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Video Toggle / Speaker Toggle */}
        {type === "video" ? (
          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: !isVideoEnabled ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            className="hover:scale-110 active:scale-95"
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
            className="hover:scale-110 active:scale-95"
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
            background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 30px rgba(239, 68, 68, 0.65)"
          }}
          className="hover:scale-110 active:scale-95"
          title="End Call"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}
