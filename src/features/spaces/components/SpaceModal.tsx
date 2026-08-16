"use client";

import { useState, useEffect, useRef } from "react";
import { X, Mic, MicOff, Volume2, Users, Radio, Heart, Hand, MessageSquare, Sparkles, VolumeX, Crown } from "lucide-react";

interface SpaceModalProps {
  space: {
    id: string;
    title: string;
    host: { id: string; name: string; avatar?: string | null; username?: string | null };
    topic?: string;
  };
  onClose: () => void;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
}

export function SpaceModal({ space, onClose }: SpaceModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [role, setRole] = useState<"host" | "speaker" | "listener">(
    space.host.name === "You" || space.host.id === "me" ? "host" : "listener"
  );

  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [listenersCount, setListenersCount] = useState(38);
  const [audioActive, setAudioActive] = useState(true);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize Microphone Web Audio Stream for live speaking
  useEffect(() => {
    let streamObj: MediaStream | null = null;

    async function initMicrophone() {
      if (!isMuted && (role === "host" || role === "speaker")) {
        try {
          streamObj = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicStream(streamObj);

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioCtxRef.current = ctx;
            const source = ctx.createMediaStreamSource(streamObj);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Draw Frequency Visualizer Bar
            const drawVisualizer = () => {
              if (canvasRef.current && analyserRef.current) {
                const canvas = canvasRef.current;
                const canvasCtx = canvas.getContext("2d");
                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyserRef.current.getByteFrequencyData(dataArray);

                if (canvasCtx) {
                  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                  const barWidth = (canvas.width / bufferLength) * 2;
                  let x = 0;

                  for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * canvas.height;
                    canvasCtx.fillStyle = "#10b981";
                    canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
                    x += barWidth;
                  }
                }
              }
              animFrameRef.current = requestAnimationFrame(drawVisualizer);
            };

            drawVisualizer();
          }
        } catch (e) {
          console.log("Microphone access permission denied or unavailable", e);
        }
      }
    }

    initMicrophone();

    return () => {
      if (streamObj) {
        streamObj.getTracks().forEach((track) => track.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, [isMuted, role]);

  const triggerReaction = (emoji: string) => {
    const newEmoji: FloatingEmoji = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      left: Math.random() * 60 + 20
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 2000);
  };

  const toggleMic = () => {
    setIsMuted(!isMuted);
  };

  const toggleHand = () => {
    setIsHandRaised(!isHandRaised);
    if (!isHandRaised && role === "listener") {
      setTimeout(() => {
        setRole("speaker");
        setIsHandRaised(false);
      }, 2000);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(14px)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px"
    }}>
      {/* Floating Emojis Animation Canvas Overlay */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", overflow: "hidden", zIndex: 10000 }}>
        {floatingEmojis.map(item => (
          <div
            key={item.id}
            className="animate-slide-up"
            style={{
              position: "absolute",
              bottom: "120px",
              left: `${item.left}%`,
              fontSize: "2.8rem",
              opacity: 0,
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))"
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      <div className="glass animate-scale-in" style={{
        width: "100%", maxWidth: "560px",
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "32px", padding: "28px",
        display: "flex", flexDirection: "column", gap: "22px",
        boxShadow: "0 30px 80px rgba(0, 0, 0, 0.7)", position: "relative"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "rgba(239, 68, 68, 0.15)", color: "#ef4444",
                padding: "4px 12px", borderRadius: "99px", fontSize: "0.78rem", fontWeight: 800
              }}>
                <Radio size={14} className="animate-pulse" /> LIVE NOW
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 700 }}>
                {space.topic || "Tech & Coding"}
              </span>
            </div>

            <h2 style={{ margin: "4px 0 0 0", fontSize: "1.3rem", fontWeight: 900, color: "var(--color-text-main)", lineHeight: 1.3 }}>
              {space.title}
            </h2>
          </div>

          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}>
            <X size={24} />
          </button>
        </div>

        {/* SPEAKERS STAGE GRID */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--color-text-muted)", letterSpacing: "0.5px" }}>
              STAGE SPEAKERS
            </span>
            <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <Volume2 size={14} className="animate-pulse" /> Live Voice Connected
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
            {/* Speaker 1: Host */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: "70px", height: "70px", borderRadius: "50%",
                  border: "3px solid var(--color-primary)",
                  background: "linear-gradient(135deg, var(--color-primary), #00c6ff)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.6rem",
                  boxShadow: "0 0 20px rgba(29, 155, 240, 0.5)"
                }}>
                  {space.host.name.charAt(0).toUpperCase()}
                </div>
                {/* Voice Equalizer animation badge */}
                <div style={{
                  position: "absolute", bottom: "-2px", right: "-2px",
                  background: "#10b981", color: "white", borderRadius: "50%",
                  padding: "4px", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--color-bg-surface)"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "10px" }}>
                    <div style={{ width: "2px", background: "white", animation: "bounce 0.5s infinite alternate" }} />
                    <div style={{ width: "2px", background: "white", animation: "bounce 0.7s infinite alternate" }} />
                    <div style={{ width: "2px", background: "white", animation: "bounce 0.4s infinite alternate" }} />
                  </div>
                </div>
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--color-text-main)", textAlign: "center" }}>{space.host.name}</span>
              <span style={{ fontSize: "0.7rem", background: "var(--color-primary)", color: "white", padding: "2px 8px", borderRadius: "99px", fontWeight: 800, display: "flex", alignItems: "center", gap: "3px" }}>
                <Crown size={10} /> Host
              </span>
            </div>

            {/* Speaker 2 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: "70px", height: "70px", borderRadius: "50%",
                  border: "3px solid #8b5cf6",
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.6rem"
                }}>
                  V
                </div>
                <div style={{
                  position: "absolute", bottom: "-2px", right: "-2px",
                  background: "#10b981", color: "white", borderRadius: "50%",
                  padding: "4px", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--color-bg-surface)"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "10px" }}>
                    <div style={{ width: "2px", background: "white", animation: "bounce 0.6s infinite alternate" }} />
                    <div style={{ width: "2px", background: "white", animation: "bounce 0.3s infinite alternate" }} />
                    <div style={{ width: "2px", background: "white", animation: "bounce 0.8s infinite alternate" }} />
                  </div>
                </div>
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--color-text-main)" }}>Varun B.</span>
              <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontWeight: 700 }}>Speaker</span>
            </div>

            {/* Speaker 3: You */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: "70px", height: "70px", borderRadius: "50%",
                  border: isMuted ? "3px solid #ef4444" : "3px solid #10b981",
                  background: "var(--color-bg-base)", color: "var(--color-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.5rem",
                  boxShadow: isMuted ? "none" : "0 0 16px rgba(16, 185, 129, 0.4)"
                }}>
                  You
                </div>
                <div style={{
                  position: "absolute", bottom: "-2px", right: "-2px",
                  background: isMuted ? "#ef4444" : "#10b981", color: "white", borderRadius: "50%",
                  padding: "5px", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--color-bg-surface)"
                }}>
                  {isMuted ? <MicOff size={11} /> : <Mic size={11} />}
                </div>
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--color-text-main)" }}>You</span>
              <span style={{ fontSize: "0.7rem", color: isMuted ? "#ef4444" : "#10b981", fontWeight: 800 }}>
                {role === "listener" ? "Listener" : isMuted ? "Muted" : "Speaking"}
              </span>
            </div>
          </div>
        </div>

        {/* LISTENERS BAR */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--color-bg-base)", padding: "12px 16px", borderRadius: "20px",
          border: "1px solid var(--color-border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={18} style={{ color: "var(--color-primary)" }} />
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-text-main)" }}>
              {listenersCount} Listeners in room
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "-6px" }}>
            {["A", "B", "C", "D"].map((initial, i) => (
              <div key={i} style={{
                width: "26px", height: "26px", borderRadius: "50%",
                background: "var(--color-primary)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.7rem", border: "2px solid var(--color-bg-surface)",
                marginLeft: i > 0 ? "-8px" : 0
              }}>
                {initial}
              </div>
            ))}
          </div>
        </div>

        {/* EMOJI REACTION PHYSICS BAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", textAlign: "center" }}>
            Tap to send live reactions
          </span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            {["🔥", "👏", "❤️", "🚀", "💯", "🎉"].map(emoji => (
              <button
                key={emoji}
                onClick={() => triggerReaction(emoji)}
                style={{
                  background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
                  borderRadius: "50%", width: "44px", height: "44px",
                  fontSize: "1.4rem", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.15s ease"
                }}
                className="hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* ACTION CONTROLS FOOTER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
          <button 
            onClick={toggleMic}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 20px", borderRadius: "99px",
              background: isMuted ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: isMuted ? "#ef4444" : "#10b981", border: "none", fontWeight: 800, fontSize: "0.95rem",
              cursor: "pointer", transition: "transform 0.15s ease"
            }}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            <span>{isMuted ? "Unmute Mic" : "Mic On"}</span>
          </button>

          <button 
            onClick={toggleHand}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 20px", borderRadius: "99px",
              background: isHandRaised ? "rgba(245, 158, 11, 0.2)" : "var(--color-bg-base)",
              color: isHandRaised ? "#f59e0b" : "var(--color-text-main)",
              border: "1px solid var(--color-border)", fontWeight: 800, fontSize: "0.95rem",
              cursor: "pointer"
            }}
          >
            <Hand size={20} />
            <span>{role === "speaker" || role === "host" ? "Speaking" : isHandRaised ? "Requested..." : "Raise Hand"}</span>
          </button>

          <button 
            onClick={onClose}
            style={{
              padding: "12px 24px", borderRadius: "99px",
              background: "#ef4444", color: "white",
              border: "none", fontWeight: 800, fontSize: "0.95rem",
              cursor: "pointer", boxShadow: "0 6px 20px rgba(239, 68, 68, 0.3)"
            }}
          >
            Leave Quietly
          </button>
        </div>
      </div>
    </div>
  );
}
