"use client";

import { useState, useEffect } from "react";
import { Plus, User } from "lucide-react";
import { StoryViewer } from "./StoryViewer";
import { CreateStoryModal } from "./CreateStoryModal";

interface Story {
  id: string;
  authorId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string;
  musicUrl: string | null;
  overlays: string | null;
  bgColor: string | null;
  privacy: string;
  allowedUsers: string | null;
  createdAt: string;
  expiresAt: string;
}

interface UserWithStories {
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  stories: Story[];
}

export function StoryFeed({ currentUserId, currentUserAvatar }: { currentUserId: string, currentUserAvatar: string | null }) {
  const [groupedStories, setGroupedStories] = useState<UserWithStories[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/stories");
      if (res.ok) {
        const data = await res.json();
        setGroupedStories(data.groupedStories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleStoryGroupClick = (index: number) => {
    setActiveStoryGroupIndex(index);
  };

  const handleCloseViewer = () => {
    setActiveStoryGroupIndex(null);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchStories();
  };

  const hasOwnStory = groupedStories.some(g => g.user.id === currentUserId);

  return (
    <div style={{
      display: "flex",
      flexShrink: 0,
      gap: "16px",
      padding: "16px",
      overflowX: "auto",
      scrollbarWidth: "none",
      borderBottom: "1px solid var(--color-border)",
      background: "var(--color-bg-base)"
    }}>
      {/* 1. Add Story Button (Always visible) */}
      <div 
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", flexShrink: 0 }}
        onClick={() => setShowCreateModal(true)}
      >
        <div style={{ position: "relative", width: "64px", height: "64px", borderRadius: "50%", padding: "2px", background: "var(--color-border)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--color-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-surface)" }}>
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt="You" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <User size={32} color="var(--color-text-muted)" />
            )}
          </div>
          <div style={{
            position: "absolute", bottom: "0", right: "0", width: "20px", height: "20px",
            backgroundColor: "var(--color-primary)", color: "white", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid var(--color-bg-base)"
          }}>
            <Plus size={14} strokeWidth={3} />
          </div>
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-main)", fontWeight: 500 }}>Add Story</span>
      </div>

      {/* 2. Your Story (If it exists) */}
      {hasOwnStory && (
        <div 
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", flexShrink: 0 }}
          onClick={() => {
            const idx = groupedStories.findIndex(g => g.user.id === currentUserId);
            handleStoryGroupClick(idx);
          }}
        >
          <div style={{ 
            position: "relative", width: "64px", height: "64px", borderRadius: "50%", padding: "2px", 
            background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" 
          }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--color-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-surface)" }}>
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="You" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={32} color="var(--color-text-muted)" />
              )}
            </div>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-main)", fontWeight: 500 }}>Your Story</span>
        </div>
      )}

      {/* Render Story Groups */}
      {groupedStories.map((group, index) => {
        // If it's the current user, we already rendered their avatar above, but we might want it in the list if they have a story.
        // Actually, Instagram keeps "Your Story" as the first item always, and updates its ring if you have one.
        if (group.user.id === currentUserId) return null; // We'll skip it here since we handle it in the first item.

        return (
          <div 
            key={group.user.id} 
            onClick={() => handleStoryGroupClick(index)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", flexShrink: 0 }}
          >
            <div style={{ 
              position: "relative", width: "64px", height: "64px", borderRadius: "50%", padding: "2px", 
              background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" // Instagram-like gradient
            }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--color-bg-base)" }}>
                {group.user.avatar ? (
                  <img src={group.user.avatar} alt={group.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {group.user.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-main)", fontWeight: 500, maxWidth: "64px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {group.user.name.split(" ")[0]}
            </span>
          </div>
        )
      })}

      {/* Overlays */}
      {activeStoryGroupIndex !== null && (
        <StoryViewer 
          groupedStories={groupedStories} 
          initialGroupIndex={activeStoryGroupIndex}
          onClose={handleCloseViewer}
        />
      )}

      {showCreateModal && (
        <CreateStoryModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
