"use client";

import { useState } from "react";
import { PostCard } from "@/features/posts/components/PostCard";
import { Sparkles, MessageCircle, Image as ImageIcon, Heart } from "lucide-react";

interface ProfileTabsProps {
  posts: any[];
  replies: any[];
  mediaPosts: any[];
  likedPosts: any[];
  currentUserId: string;
  isOwnProfile: boolean;
  isBlockedByMe: boolean;
  hasBlockedMe: boolean;
}

export function ProfileTabs({
  posts,
  replies,
  mediaPosts,
  likedPosts,
  currentUserId,
  isOwnProfile,
  isBlockedByMe,
  hasBlockedMe
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "media" | "likes">("posts");

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

  const currentList =
    activeTab === "replies"
      ? replies
      : activeTab === "media"
      ? mediaPosts
      : activeTab === "likes"
      ? likedPosts
      : posts;

  return (
    <div style={{ width: "100%" }}>
      {/* Tab Navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "8px" }}>
        {[
          { key: "posts", label: "Posts", count: posts.length },
          { key: "replies", label: "Replies", count: replies.length },
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
                fontSize: "0.95rem", fontWeight: isActive ? 800 : 500,
                color: isActive ? "var(--color-text-main)" : "var(--color-text-muted)",
                cursor: "pointer", position: "relative", transition: "color 0.2s"
              }}
            >
              <span>{t.label}</span>
              {isActive && (
                <div style={{
                  position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                  width: "50px", height: "4px", background: "var(--color-primary)", borderRadius: "99px"
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content List */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {currentList.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
            <Sparkles size={32} style={{ margin: "0 auto 12px", color: "var(--color-primary)" }} />
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 4px" }}>
              No {activeTab} yet
            </h4>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              {activeTab === "posts"
                ? "This user has not posted anything yet."
                : activeTab === "replies"
                ? "No replies found."
                : activeTab === "media"
                ? "No photos or videos posted yet."
                : "No liked posts found."}
            </p>
          </div>
        ) : (
          currentList.map((post) => (
            <PostCard key={post.id} post={post as any} currentUserId={currentUserId} />
          ))
        )}
      </div>
    </div>
  );
}
