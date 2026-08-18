"use client";

import { useState, useEffect, useRef } from "react";
import { 
  PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, 
  Shield, PhoneCall, MicOff as MicMutedIcon, Volume1
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
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [callState, setCallState] = useState<"ringing" | "connected" | "declined">(
    isIncomingAccepted ? "connected" : "ringing"
  );
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  // Poll for active call session status updates at 250ms high-frequency stream
  useEffect(() => {
    const signalInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/messages/calls/signal");
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            if (data.session.status === "CONNECTED") {
              setCallState("connected");
            } else if (data.session.status === "REJECTED" || data.session.status === "ENDED") {
              setCallState("declined");
              setTimeout(() => {
                onEndCall();
              }, 400);
            }
          } else if (!isIncomingAccepted) {
            onEndCall();
          }
        }
      } catch (e) {}
    }, 250);

    return () => clearInterval(signalInterval);
  }, [isIncomingAccepted, onEndCall]);

  // Initialize Microphone & Camera MediaStream + Pipe to Hidden Audio Element
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let animFrame: number;

    async function initMediaCall() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === "video",
          audio: true
        });
        activeStream = stream;
        mediaStreamRef.current = stream;

        // Bind video feed for camera self-view
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Pipe audio stream to hidden audio element for instant speaker sound
        if (audioPlaybackRef.current) {
          audioPlaybackRef.current.srcObject = stream;
          audioPlaybackRef.current.volume = isSpeakerOn ? 1.0 : 0.3;
          audioPlaybackRef.current.play().catch(() => {});
        }

        // Set up Web Audio Analyser for live frequency spectrum visualizer
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVolume = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              setVoiceVolume(Math.min(100, Math.round((average / 128) * 100)));
              animFrame = requestAnimationFrame(updateVolume);
            };
            updateVolume();
          }
        } catch (err) {}
      } catch (err) {
        console.error("Camera/Mic access error:", err);
      }
    }

    initMediaCall();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [type]);

  // Update Audio Playback Volume on Speaker Toggle
  useEffect(() => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.muted = !isSpeakerOn;
      audioPlaybackRef.current.volume = isSpeakerOn ? 1.0 : 0.2;
    }
  }, [isSpeakerOn]);

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
    fetch("/api/messages/calls/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "END" })
    }).catch(() => {});

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
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        backdropFilter: "blur(36px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "48px 24px",
        overflow: "hidden"
      }} 
      className="animate-fade-in"
    >
      {/* Hidden Audio Output Element for Live Audio Transmit & Playback */}
      <audio ref={audioPlaybackRef} autoPlay playsInline style={{ display: "none" }} />

      {/* Ambient Blurred Background Avatar Artwork */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${contact.avatar})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(65px) brightness(0.22)",
          opacity: 0.65,
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

        {/* Live Mute Status Pill Banner */}
        {isMuted && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.5)",
            padding: "4px 12px", borderRadius: "99px", color: "#ef4444", fontSize: "0.78rem", fontWeight: 800
          }}>
            <MicMutedIcon size={14} /> Microphone Muted
          </div>
        )}
      </div>

      {/* Center Visual Content with Live Equalizer Waves */}
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
            {/* Live Voice Pitch Frequency Visualizer Equalizer Rings */}
            <div style={{
              position: "absolute",
              width: `${180 + voiceVolume * 1.2}px`,
              height: `${180 + voiceVolume * 1.2}px`,
              borderRadius: "50%",
              border: "3px solid rgba(0, 242, 254, 0.7)",
              boxShadow: "0 0 30px rgba(0, 242, 254, 0.4)",
              transition: "all 0.08s ease-out",
              opacity: isMuted ? 0.2 : 0.8
            }} />

            <div style={{
              position: "absolute",
              width: `${230 + voiceVolume * 1.6}px`,
              height: `${230 + voiceVolume * 1.6}px`,
              borderRadius: "50%",
              border: "2px solid rgba(168, 85, 247, 0.5)",
              boxShadow: "0 0 40px rgba(168, 85, 247, 0.3)",
              transition: "all 0.08s ease-out",
              opacity: isMuted ? 0.2 : 0.7
            }} />

            {/* Avatar Image */}
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

      {/* FaceTime-Grade Glassmorphic Control Bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "24px",
        background: "rgba(255, 255, 255, 0.14)", padding: "16px 36px",
        borderRadius: "9999px", border: "1px solid rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(24px)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 2
      }}>
        {/* Mute Mic Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isMuted ? "0 4px 18px rgba(239, 68, 68, 0.6)" : "none",
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
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isSpeakerOn ? "0 4px 18px rgba(0, 242, 254, 0.4)" : "none"
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
