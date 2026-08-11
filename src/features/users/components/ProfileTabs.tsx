"use client";

import { useState } from "react";
import { PostCard } from "@/features/posts/components/PostCard";
import { Sparkles, FileText, MessageSquare, Repeat, Image as ImageIcon, Heart } from "lucide-react";

interface ProfileTabsProps {
  posts: any[];
  replies: any[];
  repostPosts: any[];
  mediaPosts: any[];
  likedPosts: any[];
  currentUserId: string;
  isOwnProfile: boolean;
  isBlockedByMe: boolean;
  hasBlockedMe: boolean;
  username: string;
  externalSearchQuery?: string;
}

export function ProfileTabs({
  posts,
  replies,
  repostPosts,
  mediaPosts,
  likedPosts,
  currentUserId,
  isOwnProfile,
  isBlockedByMe,
  hasBlockedMe,
  username,
  externalSearchQuery
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "reposts" | "media" | "likes">("posts");

  const searchQuery = externalSearchQuery || "";

  if (isBlockedByMe) {
    return (
      <div style={{ padding: "32px 20px", borderRadius: "16px", textAlign: "center", border: "1px solid #ff4d4d", background: "rgba(255,77,77,0.05)" }}>
        <p style={{ color: "#ff4d4d", fontWeight: 700, fontSize: "1.1rem" }}>You have blocked this user.</p>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Unblock them to view their posts.</p>
      </div>
    );
  }

  if (hasBlockedMe) {
    return (
      <div style={{ padding: "32px 20px", borderRadius: "16px", textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>This user has restricted access to their profile.</p>
      </div>
    );
  }

  const rawList =
    activeTab === "replies"
      ? replies
      : activeTab === "reposts"
      ? repostPosts
      : activeTab === "media"
      ? mediaPosts
      : activeTab === "likes"
      ? likedPosts
      : posts;

  // Filter list by top header search query
  const filteredList = searchQuery.trim()
    ? rawList.filter(p => {
        const text = (p.content || "").toLowerCase();
        const authorName = (p.author?.name || "").toLowerCase();
        const authorUsername = (p.author?.username || "").toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        return text.includes(q) || authorName.includes(q) || authorUsername.includes(q);
      })
    : rawList;

  const TABS = [
    { key: "posts", label: "Posts", icon: FileText, count: posts.length },
    { key: "replies", label: "Replies", icon: MessageSquare, count: replies.length },
    { key: "reposts", label: "Reposts", icon: Repeat, count: repostPosts.length },
    { key: "media", label: "Media", icon: ImageIcon, count: mediaPosts.length },
    { key: "likes", label: "Likes", icon: Heart, count: likedPosts.length }
  ];

  return (
    <div style={{ width: "100%" }}>
      {/* Responsive Tab Navigation with Icons + Text for effortless mobile/desktop navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "8px" }}>
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                flex: 1, padding: "14px 0", background: "none", border: "none",
                fontSize: "0.92rem", fontWeight: isActive ? 800 : 500,
                color: isActive ? "var(--color-text-main)" : "var(--color-text-muted)",
                cursor: "pointer", position: "relative", transition: "color 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              <Icon size={18} style={{ color: isActive ? "var(--color-primary)" : "inherit" }} />
              <span className="tab-label-text">{t.label}</span>
              {isActive && (
                <div style={{
                  position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                  width: "45px", height: "4px", background: "var(--color-primary)", borderRadius: "99px"
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content List */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filteredList.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
            <Sparkles size={32} style={{ margin: "0 auto 12px", color: "var(--color-primary)" }} />
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 4px" }}>
              {searchQuery ? "No matching posts found" : `No ${activeTab} yet`}
            </h4>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              {searchQuery
                ? `No posts matching "${searchQuery}" in this tab.`
                : activeTab === "posts"
                ? "This user has not posted anything yet."
                : activeTab === "replies"
                ? "No replies found."
                : activeTab === "reposts"
                ? "No reposts or quote posts found."
                : activeTab === "media"
                ? "No photos or videos posted yet."
                : "No liked posts found."}
            </p>
          </div>
        ) : (
          filteredList.map((post) => (
            <PostCard key={post.id} post={post as any} currentUserId={currentUserId} />
          ))
        )}
      </div>
    </div>
  );
}
