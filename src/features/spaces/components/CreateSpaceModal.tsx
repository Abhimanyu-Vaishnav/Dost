"use client";

import { useState } from "react";
import { X, Radio, Sparkles, Hash, Volume2 } from "lucide-react";

interface CreateSpaceModalProps {
  onClose: () => void;
  onSpaceCreated: (space: any) => void;
}

const PRESET_TOPICS = [
  "🚀 Tech & Coding",
  "🎨 UI/UX Design",
  "🎵 Music & Chill",
  "💡 Startup & Business",
  "🔥 Crypto & Web3",
  "💬 General Chat"
];

export function CreateSpaceModal({ onClose, onSpaceCreated }: CreateSpaceModalProps) {
  const [title, setTitle] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(PRESET_TOPICS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Live DOST Audio Space",
          topic: selectedTopic
        })
      });

      const data = await res.json();
      if (res.ok && data.space) {
        onSpaceCreated(data.space);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(10px)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px"
    }}>
      <div className="glass animate-scale-in" style={{
        width: "100%", maxWidth: "460px",
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "28px", padding: "24px",
        display: "flex", flexDirection: "column", gap: "20px",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "white",
              boxShadow: "0 0 16px rgba(29, 155, 240, 0.4)"
            }}>
              <Radio size={22} className="animate-pulse" />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              Start your Live Space
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleStart} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Title Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
              What do you want to talk about?
            </label>
            <input
              type="text"
              placeholder="e.g. Building Next.js Apps live with AI!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "14px",
                border: "1px solid var(--color-border)", background: "var(--color-bg-base)",
                color: "var(--color-text-main)", fontSize: "1rem", outline: "none",
                fontWeight: 600
              }}
            />
          </div>

          {/* Topic Select */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
              Choose a Topic
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {PRESET_TOPICS.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  style={{
                    padding: "8px 14px", borderRadius: "99px",
                    border: selectedTopic === topic ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                    background: selectedTopic === topic ? "rgba(29, 155, 240, 0.12)" : "var(--color-bg-base)",
                    color: selectedTopic === topic ? "var(--color-primary)" : "var(--color-text-main)",
                    fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", padding: "14px 0", borderRadius: "99px",
              background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)",
              color: "white", fontWeight: 800, fontSize: "1rem", border: "none",
              cursor: "pointer", boxShadow: "0 8px 24px rgba(29, 155, 240, 0.4)",
              marginTop: "8px"
            }}
          >
            {isLoading ? "Starting Space..." : "🎙️ Go Live Now"}
          </button>
        </form>
      </div>
    </div>
  );
}
