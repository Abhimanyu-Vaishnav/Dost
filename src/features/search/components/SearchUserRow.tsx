"use client";

import { useState } from "react";
import Link from "next/link";
import { StoryViewer } from "@/features/stories/components/StoryViewer";

interface SearchUserRowProps {
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    stories: any[];
  };
}

export function SearchUserRow({ user }: SearchUserRowProps) {
  const [showViewer, setShowViewer] = useState(false);
  const hasStories = user.stories && user.stories.length > 0;

  const handleAvatarClick = (e: React.MouseEvent) => {
    if (hasStories) {
      e.preventDefault();
      e.stopPropagation();
      setShowViewer(true);
    }
  };

  const groupedStories = hasStories
    ? [
        {
          user: {
            id: user.id,
            name: user.name || "Unknown",
            avatar: user.avatar,
          },
          stories: user.stories,
        },
      ]
    : [];

  return (
    <>
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "8px 12px",
          borderRadius: "12px",
          transition: "background 0.2s"
        }}
        className="hover-bg"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Avatar Container with Conditional Ring */}
          <div 
            onClick={handleAvatarClick}
            style={{ 
              position: "relative",
              width: "48px", 
              height: "48px", 
              borderRadius: "50%",
              padding: hasStories ? "2px" : "0", 
              background: hasStories 
                ? "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" 
                : "transparent",
              cursor: hasStories ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.1s"
            }}
            className={hasStories ? "hover-scale" : ""}
          >
            <div style={{ 
              width: "100%", 
              height: "100%", 
              borderRadius: "50%", 
              overflow: "hidden", 
              border: hasStories ? "2px solid var(--color-bg-surface)" : "none",
              backgroundColor: "var(--color-bg-base)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "white"
            }}>
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name || "User"} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              ) : (
                (user.name || "U").charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Name & Profile link */}
          <Link href={`/profile/${user.id}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "1.05rem" }}>{user.name}</span>
            {hasStories && (
              <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 600 }}>
                View Story
              </span>
            )}
          </Link>
        </div>

        {/* View Profile Action Link */}
        <Link 
          href={`/profile/${user.id}`}
          style={{
            padding: "6px 16px",
            borderRadius: "99px",
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
            fontWeight: 700,
            fontSize: "0.85rem",
            textDecoration: "none",
            transition: "all 0.2s"
          }}
          className="hover-scale"
        >
          Profile
        </Link>
      </div>

      {showViewer && hasStories && (
        <StoryViewer 
          groupedStories={groupedStories}
          initialGroupIndex={0}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}
