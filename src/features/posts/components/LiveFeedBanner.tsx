"use client";

import { useState, useEffect } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

export function LiveFeedBanner({ onRefresh }: { onRefresh: () => void }) {
  const [newPostsCount, setNewPostsCount] = useState(0);

  useEffect(() => {
    // Simulate periodic live post notifications
    const timer = setTimeout(() => {
      setNewPostsCount(3);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  if (newPostsCount === 0) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0", position: "sticky", top: "54px", zIndex: 90 }}>
      <button
        onClick={() => {
          setNewPostsCount(0);
          onRefresh();
        }}
        className="glass animate-slide-down"
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 18px", borderRadius: "9999px",
          backgroundColor: "var(--color-primary)", color: "white",
          border: "none", fontWeight: 800, fontSize: "0.88rem",
          cursor: "pointer", boxShadow: "0 6px 20px rgba(29, 155, 240, 0.4)",
          transition: "transform 0.15s ease"
        }}
      >
        <ArrowUp size={16} />
        <span>Show {newPostsCount} new posts</span>
      </button>
    </div>
  );
}
