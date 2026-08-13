"use client";

import { useEffect, useState } from "react";
import { Radio, Users, Plus, Sparkles } from "lucide-react";
import { SpaceModal } from "./SpaceModal";

export function ActiveSpacesBar() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/spaces")
      .then(res => res.json())
      .then(data => {
        if (data.spaces) setSpaces(data.spaces);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {selectedSpace && (
        <SpaceModal space={selectedSpace} onClose={() => setSelectedSpace(null)} />
      )}

      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        overflowX: "auto",
        scrollbarWidth: "none",
        backgroundColor: "var(--color-bg-base)"
      }}>
        {/* Create Space button */}
        <button
          onClick={() => setSelectedSpace({
            id: `space-${Date.now()}`,
            title: "Your DOST Audio Space",
            host: { id: "me", name: "You" }
          })}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 14px", borderRadius: "99px",
            background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)",
            color: "white", border: "none", fontWeight: 700, fontSize: "0.85rem",
            cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 12px rgba(29, 155, 240, 0.3)"
          }}
        >
          <Radio size={16} className="animate-pulse" />
          <span>Start Space</span>
        </button>

        {/* Live Spaces Pills */}
        {spaces.map(space => (
          <div
            key={space.id}
            onClick={() => setSelectedSpace(space)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "6px 14px", borderRadius: "99px",
              background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
              cursor: "pointer", flexShrink: 0, transition: "transform 0.15s ease"
            }}
            className="hover:scale-105"
          >
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "var(--color-primary)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem"
            }}>
              {space.host.name.charAt(0)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", maxWidth: "160px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--color-text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {space.title}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                <Radio size={10} className="animate-pulse" /> {space.listenersCount} listening
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
