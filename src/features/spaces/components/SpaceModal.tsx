"use client";

import { useState } from "react";
import { X, Mic, MicOff, Volume2, Users, Radio, Heart, Hand, MessageSquare } from "lucide-react";

interface SpaceModalProps {
  space: {
    id: string;
    title: string;
    host: { id: string; name: string; avatar?: string | null; username?: string | null };
    topic?: string;
  };
  onClose: () => void;
}

export function SpaceModal({ space, onClose }: SpaceModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [reactionToast, setReactionToast] = useState<string | null>(null);

  const triggerReaction = (emoji: string) => {
    setReactionToast(emoji);
    setTimeout(() => setReactionToast(null), 1500);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px"
    }}>
      <div className="glass animate-scale-in" style={{
        width: "100%", maxWidth: "520px",
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "28px", padding: "24px",
        display: "flex", flexDirection: "column", gap: "20px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)", position: "relative"
      }}>
        {/* Floating reaction animation */}
        {reactionToast && (
          <div className="animate-slide-up" style={{
            position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)",
            fontSize: "2.5rem", pointerEvents: "none", zIndex: 10
          }}>
            {reactionToast}
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "4px 12px", borderRadius: "99px", fontSize: "0.78rem", fontWeight: 800 }}>
              <Radio size={14} className="animate-pulse" /> LIVE SPACE
            </div>
            <h3 style={{ margin: "4px 0 0 0", fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1.3 }}>
              {space.title}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}>
            <X size={22} />
          </button>
        </div>

        {/* Speakers Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Speakers</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {/* Host */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                border: "3px solid var(--color-primary)",
                background: "var(--color-primary-light)", color: "var(--color-primary)",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.4rem",
                boxShadow: "0 0 16px rgba(29, 155, 240, 0.4)"
              }}>
                {space.host.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>{space.host.name}</span>
              <span style={{ fontSize: "0.72rem", background: "var(--color-primary)", color: "white", padding: "1px 6px", borderRadius: "99px", fontWeight: 800 }}>Host</span>
            </div>

            {/* Speaker 2 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                border: "2px solid var(--color-border)",
                background: "var(--color-bg-base)", color: "var(--color-text-main)",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.4rem"
              }}>
                V
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>Varun B.</span>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Speaker</span>
            </div>

            {/* Listener / You */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                border: isMuted ? "2px solid #ef4444" : "2px solid #10b981",
                background: "var(--color-bg-base)", color: "var(--color-text-main)",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.4rem"
              }}>
                You
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>You</span>
              <span style={{ fontSize: "0.72rem", color: isMuted ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                {isMuted ? "Muted" : "Speaking"}
              </span>
            </div>
          </div>
        </div>

        {/* Reaction Emoji Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", background: "var(--color-bg-base)", padding: "10px", borderRadius: "99px", border: "1px solid var(--color-border)" }}>
          {["🔥", "👏", "❤️", "🚀", "💯"].map(emoji => (
            <button key={emoji} onClick={() => triggerReaction(emoji)} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", transition: "transform 0.1s" }} className="hover:scale-125">
              {emoji}
            </button>
          ))}
        </div>

        {/* Action Controls Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "99px",
              background: isMuted ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: isMuted ? "#ef4444" : "#10b981", border: "none", fontWeight: 700, cursor: "pointer"
            }}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          <button 
            onClick={() => setIsHandRaised(!isHandRaised)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "99px",
              background: isHandRaised ? "rgba(245, 158, 11, 0.2)" : "var(--color-bg-base)",
              color: isHandRaised ? "#f59e0b" : "var(--color-text-main)",
              border: "1px solid var(--color-border)", fontWeight: 700, cursor: "pointer"
            }}
          >
            <Hand size={18} />
            <span>{isHandRaised ? "Hand Raised" : "Raise Hand"}</span>
          </button>

          <button 
            onClick={onClose}
            style={{
              padding: "10px 20px", borderRadius: "99px",
              background: "#ef4444", color: "white",
              border: "none", fontWeight: 700, cursor: "pointer"
            }}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
