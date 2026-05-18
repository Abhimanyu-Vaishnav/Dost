"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FeedTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "for-you";

  const handleTabChange = (tab: string) => {
    router.push(`/feed?tab=${tab}`);
  };

  return (
    <div style={{ 
      display: "flex", 
      width: "100%", 
      borderBottom: "1px solid var(--color-border)",
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(8px)",
      position: "sticky",
      top: "53px",
      zIndex: 10
    }}>
      <button 
        onClick={() => handleTabChange("for-you")}
        style={{
          flex: 1,
          padding: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: activeTab === "for-you" ? 800 : 500,
          color: activeTab === "for-you" ? "var(--color-text-main)" : "var(--color-text-muted)",
          position: "relative",
          transition: "all 0.2s"
        }}
        className="hover-bg"
      >
        For you
        {activeTab === "for-you" && (
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "56px", height: "4px", background: "var(--color-primary)",
            borderRadius: "99px"
          }} />
        )}
      </button>
      <button 
        onClick={() => handleTabChange("following")}
        style={{
          flex: 1,
          padding: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: activeTab === "following" ? 800 : 500,
          color: activeTab === "following" ? "var(--color-text-main)" : "var(--color-text-muted)",
          position: "relative",
          transition: "all 0.2s"
        }}
        className="hover-bg"
      >
        Following
        {activeTab === "following" && (
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "70px", height: "4px", background: "var(--color-primary)",
            borderRadius: "99px"
          }} />
        )}
      </button>
    </div>
  );
}
