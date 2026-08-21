"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Flame, Users, Cpu, Compass } from "lucide-react";

export function FeedTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "for-you";

  const handleTabChange = (tab: string) => {
    router.push(`/feed?tab=${tab}`);
  };

  const topicTabs = [
    { id: "for-you", label: "For you", icon: <Sparkles size={16} /> },
    { id: "following", label: "Following", icon: <Users size={16} /> },
    { id: "ai", label: "AI Tech", icon: <Cpu size={16} /> },
    { id: "tech", label: "Trending", icon: <Flame size={16} /> },
    { id: "science", label: "Explore", icon: <Compass size={16} /> },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: "56px",
        minHeight: "56px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        backgroundColor: "rgba(10, 12, 16, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        overflowX: "auto",
        scrollbarWidth: "none",
        padding: "0 8px",
        boxSizing: "border-box",
      }}
    >
      {topicTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              flex: "1 0 auto",
              height: "40px",
              padding: "0 18px",
              background: isActive ? "rgba(29, 155, 240, 0.15)" : "transparent",
              border: isActive ? "1px solid rgba(29, 155, 240, 0.4)" : "1px solid transparent",
              borderRadius: "9999px",
              cursor: "pointer",
              fontWeight: isActive ? 800 : 600,
              fontSize: "0.92rem",
              color: isActive ? "#1d9bf0" : "#94a3b8",
              position: "relative",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s ease",
              boxShadow: isActive ? "0 0 16px rgba(29, 155, 240, 0.2)" : "none",
              margin: "0 3px",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, lineHeight: 1 }}>
              {tab.icon}
              {tab.label}
            </span>

            {/* Bottom Glow Line Indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                style={{
                  position: "absolute",
                  bottom: "-8px",
                  left: "20%",
                  right: "20%",
                  height: "3px",
                  backgroundColor: "#1d9bf0",
                  borderRadius: "9999px",
                  boxShadow: "0 0 10px #1d9bf0",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
