"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FeedTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "for-you";

  const handleTabChange = (tab: string) => {
    router.push(`/feed?tab=${tab}`);
  };

  const topicTabs = [
    { id: "for-you", label: "For you" },
    { id: "following", label: "Following" },
    { id: "ai", label: "AI Engineering" },
    { id: "tech", label: "Tech" },
    { id: "science", label: "Science" },
  ];

  return (
    <div style={{ 
      display: "flex", 
      width: "100%", 
      borderBottom: "1px solid var(--color-border)",
      background: "var(--color-bg-glass)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 10,
      overflowX: "auto",
      scrollbarWidth: "none"
    }}>
      {topicTabs.map(tab => (
        <button 
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          style={{
            flex: "1 0 auto",
            padding: "14px 20px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: activeTab === tab.id ? 700 : 500,
            fontSize: "0.95rem",
            color: activeTab === tab.id ? "var(--color-text-main)" : "var(--color-text-muted)",
            position: "relative",
            transition: "color 0.15s ease",
            whiteSpace: "nowrap"
          }}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div style={{
              position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: "48px", height: "4px", background: "var(--color-primary)",
              borderRadius: "99px"
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

