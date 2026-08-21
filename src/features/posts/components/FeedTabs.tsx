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
        width: "100%",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(10, 12, 16, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        overflowX: "auto",
        scrollbarWidth: "none",
        padding: "6px 12px",
        gap: 6,
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
              padding: "10px 18px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: isActive ? 800 : 600,
              fontSize: "0.88rem",
              color: isActive ? "#00f2fe" : "#94a3b8",
              position: "relative",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 9999,
              transition: "color 0.15s ease",
            }}
          >
            {/* Sliding Glowing Pill Indicator */}
            {isActive && (
              <motion.div
                layoutId="activeFeedTabPill"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0, 242, 254, 0.14)",
                  border: "1px solid rgba(0, 242, 254, 0.35)",
                  borderRadius: 9999,
                  boxShadow: "0 0 20px rgba(0, 242, 254, 0.2)",
                  zIndex: 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 6 }}>
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
