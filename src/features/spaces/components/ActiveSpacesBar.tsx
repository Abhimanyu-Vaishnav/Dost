"use client";

import { useEffect, useState } from "react";
import { Radio, Users, Plus, Sparkles, Volume2 } from "lucide-react";
import { SpaceModal } from "./SpaceModal";
import { CreateSpaceModal } from "./CreateSpaceModal";

export function ActiveSpacesBar() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchSpaces = () => {
    fetch("/api/spaces")
      .then(res => res.json())
      .then(data => {
        if (data.spaces) setSpaces(data.spaces);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleSpaceCreated = (newSpace: any) => {
    setSpaces(prev => [newSpace, ...prev]);
    setSelectedSpace(newSpace);
  };

  return (
    <>
      {showCreateModal && (
        <CreateSpaceModal
          onClose={() => setShowCreateModal(false)}
          onSpaceCreated={handleSpaceCreated}
        />
      )}

      {selectedSpace && (
        <SpaceModal
          space={selectedSpace}
          onClose={() => setSelectedSpace(null)}
        />
      )}

      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        overflowX: "auto",
        scrollbarWidth: "none",
        backgroundColor: "var(--color-bg-base)",
        boxSizing: "border-box",
        minHeight: "64px"
      }}>
        {/* Start Space Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            height: "42px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 18px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)",
            color: "white",
            border: "none",
            fontWeight: 800,
            fontSize: "0.88rem",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(29, 155, 240, 0.35)",
            transition: "transform 0.15s ease"
          }}
          className="hover:scale-105"
        >
          <Radio size={18} className="animate-pulse" />
          <span style={{ whiteSpace: "nowrap" }}>Start Space</span>
        </button>

        {/* Live Audio Spaces Pills */}
        {spaces.map(space => (
          <div
            key={space.id}
            onClick={() => setSelectedSpace(space)}
            style={{
              height: "42px",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "0 14px",
              borderRadius: "9999px",
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              flexShrink: 0,
              boxSizing: "border-box",
              transition: "all 0.15s ease",
              minWidth: "200px"
            }}
            className="hover:scale-105 hover:border-primary"
          >
            {/* Host Avatar Circle */}
            <div style={{
              width: "28px",
              height: "28px",
              minWidth: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-primary), #00c6ff)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.85rem",
              flexShrink: 0,
              boxShadow: "0 0 10px rgba(29, 155, 240, 0.4)"
            }}>
              {space.host.name ? space.host.name.charAt(0).toUpperCase() : "U"}
            </div>

            {/* Info Text Column */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              overflow: "hidden",
              lineHeight: 1.2
            }}>
              <span style={{
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "var(--color-text-main)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "140px"
              }}>
                {space.title}
              </span>
              <span style={{
                fontSize: "0.72rem",
                color: "#ef4444",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <Radio size={10} className="animate-pulse" /> {space.listenersCount || 1} listening
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
