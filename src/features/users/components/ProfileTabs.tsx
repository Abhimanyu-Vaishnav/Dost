"use client";

import { useState } from "react";
import { PostCard } from "@/features/posts/components/PostCard";
import { Sparkles, Search, Repeat, MessageCircle, Image as ImageIcon, Heart, X } from "lucide-react";

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
  username
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "reposts" | "media" | "likes">("posts");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter list by In-Profile search query
  const filteredList = searchQuery.trim()
    ? rawList.filter(p => {
        const text = (p.content || "").toLowerCase();
        const authorName = (p.author?.name || "").toLowerCase();
        const authorUsername = (p.author?.username || "").toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        return text.includes(q) || authorName.includes(q) || authorUsername.includes(q);
      })
    : rawList;

  return (
    <div style={{ width: "100%" }}>
      {/* In-Profile Post Search Bar */}
      <div style={{ padding: "0 16px 14px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "99px", padding: "10px 16px",
          transition: "border-color 0.2s"
        }}>
          <Search size={18} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder={`Search @${username}'s posts...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "var(--color-text-main)", fontSize: "0.92rem", fontWeight: 500
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation: Posts | Replies | Reposts | Media | Likes */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "8px" }}>
        {[
          { key: "posts", label: "Posts", count: posts.length },
          { key: "replies", label: "Replies", count: replies.length },
          { key: "reposts", label: "Reposts", count: repostPosts.length },
          { key: "media", label: "Media", count: mediaPosts.length },
          { key: "likes", label: "Likes", count: likedPosts.length }
        ].map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                flex: 1, padding: "14px 0", background: "none", border: "none",
                fontSize: "0.92rem", fontWeight: isActive ? 800 : 500,
                color: isActive ? "var(--color-text-main)" : "var(--color-text-muted)",
                cursor: "pointer", position: "relative", transition: "color 0.2s"
              }}
            >
              <span>{t.label}</span>
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
