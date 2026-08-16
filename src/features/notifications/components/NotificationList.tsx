"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, UserPlus, Repeat2, PenTool, ShieldAlert, Bell, CheckCheck, Sparkles } from "lucide-react";
import { LoginDetailModal } from "./LoginDetailModal";

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  metadata?: string | null;
  createdAt: string | Date;
  actor: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  post?: {
    id: string;
    content: string;
  } | null;
}

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [filterTab, setFilterTab] = useState<string>("all");

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE": return <Heart size={20} fill="#f91880" color="#f91880" />;
      case "COMMENT": return <MessageCircle size={20} color="var(--color-primary)" />;
      case "FOLLOW": return <UserPlus size={20} color="var(--color-primary)" />;
      case "REPOST": return <Repeat2 size={20} color="#00ba7c" />;
      case "QUOTE": return <PenTool size={20} color="var(--color-primary)" />;
      case "COMMENT_LIKE": return <Heart size={18} fill="#f91880" color="#f91880" />;
      case "SYSTEM": return <ShieldAlert size={20} color="#ef4444" />;
      default: return null;
    }
  };

  const getMessage = (notification: NotificationItem) => {
    const actorName = notification.actor?.name || "Security Alert";
    switch (notification.type) {
      case "LIKE": return <span><b>{actorName}</b> liked your post</span>;
      case "COMMENT": return <span><b>{actorName}</b> commented on your post</span>;
      case "FOLLOW": return <span><b>{actorName}</b> followed you</span>;
      case "REPOST": return <span><b>{actorName}</b> reposted your post</span>;
      case "QUOTE": return <span><b>{actorName}</b> quoted your post</span>;
      case "COMMENT_LIKE": return <span><b>{actorName}</b> liked your comment</span>;
      case "SYSTEM": return (
        <span>
          <b>Security Alert:</b> New login detected on your account.
          <span style={{ display: "block", fontSize: "0.85rem", color: "var(--color-primary)", marginTop: "4px", fontWeight: 600 }}>
            Click to view device & location details →
          </span>
        </span>
      );
      default: return "";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === "unread") return !n.isRead;
    if (filterTab === "mentions") return n.type === "COMMENT" || n.type === "QUOTE";
    if (filterTab === "verified") return n.type === "SYSTEM";
    return true;
  });

  return (
    <>
      {/* Smart Notification Filter Tabs */}
      <div style={{
        display: "flex", gap: "6px", padding: "10px 16px",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg-base)",
        position: "sticky", top: "52px", zIndex: 40
      }}>
        {[
          { id: "all", label: "All" },
          { id: "unread", label: "Unread" },
          { id: "mentions", label: "Mentions" },
          { id: "verified", label: "Security & Alerts" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            style={{
              padding: "6px 14px", borderRadius: "99px",
              background: filterTab === tab.id ? "var(--color-primary)" : "var(--color-bg-surface)",
              color: filterTab === tab.id ? "white" : "var(--color-text-muted)",
              border: filterTab === tab.id ? "none" : "1px solid var(--color-border)",
              fontWeight: 700, fontSize: "0.82rem", cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
            <h3 className="text-h3">No notifications found</h3>
            <p className="text-muted">No items match your selected filter.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isSystem = n.type === "SYSTEM";

            return (
              <div
                key={n.id}
                onClick={() => isSystem && setSelectedDetails(n.metadata ? JSON.parse(n.metadata) : {})}
                style={{
                  padding: "20px 16px",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  gap: "12px",
                  backgroundColor: n.isRead ? "transparent" : "rgba(29, 155, 240, 0.05)",
                  transition: "background 0.2s",
                  cursor: isSystem ? "pointer" : "default"
                }}
                className="hover-bg-subtle"
              >
                <div style={{ marginTop: "4px", width: "40px", display: "flex", justifyContent: "flex-end" }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {!isSystem && (
                      <Link href={`/profile/${n.actor.id}`} style={{ width: "fit-content" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%",
                          backgroundColor: "var(--color-primary)", color: "white",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700,
                          overflow: "hidden"
                        }}>
                          {n.actor.avatar ? (
                            <img src={n.actor.avatar} alt={n.actor.name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (n.actor.name?.charAt(0).toUpperCase() || "?")}
                        </div>
                      </Link>
                    )}
                    <div style={{ fontSize: "1.05rem", color: "var(--color-text-main)" }}>
                      {getMessage(n)}
                    </div>
                  </div>
                  {n.post && (
                    <Link href={`/feed`} style={{ textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{
                        marginTop: "8px", padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)",
                        background: "rgba(0,0,0,0.02)"
                      }}>
                        <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: 1.4 }}>
                          {n.post.content.length > 100 ? n.post.content.substring(0, 100) + "..." : n.post.content}
                        </p>
                      </div>
                    </Link>
                  )}
                  <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <LoginDetailModal
        isOpen={!!selectedDetails}
        onClose={() => setSelectedDetails(null)}
        details={selectedDetails}
      />
    </>
  );
}
