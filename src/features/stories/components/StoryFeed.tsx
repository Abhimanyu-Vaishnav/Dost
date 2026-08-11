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
  const [chainPrompt, setChainPrompt] = useState<string | undefined>(undefined);

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/stories");
      if (res.ok) {
        const data = await res.json();
        setGroupedStories(data.groupedStories || []);
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
    setChainPrompt(undefined);
    fetchStories();
  };

  const ownStoryGroupIndex = groupedStories.findIndex(g => g.user.id === currentUserId);
  const hasOwnStory = ownStoryGroupIndex !== -1;

  return (
    <div style={{
      display: "flex",
      flexShrink: 0,
      gap: "18px",
      padding: "16px",
      overflowX: "auto",
      scrollbarWidth: "none",
      borderBottom: "1px solid var(--color-border)",
      background: "var(--color-bg-base)",
      alignItems: "center"
    }}>
      {/* 1. Current User Story Avatar Card (With + Badge for 1-tap quick creation & Dost Primary Accent Glow Ring) */}
      <div 
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", flexShrink: 0 }}
        onClick={() => {
          if (hasOwnStory) {
            handleStoryGroupClick(ownStoryGroupIndex);
          } else {
            setShowCreateModal(true);
          }
        }}
        className="hover-scale"
      >
        <div style={{ 
          position: "relative", width: "66px", height: "66px", borderRadius: "50%", padding: "3px",
          background: hasOwnStory 
            ? "linear-gradient(45deg, var(--color-primary, #1d9bf0), #00c6ff)"
            : "var(--color-border)",
          boxShadow: hasOwnStory ? "0 0 14px rgba(29, 155, 240, 0.4)" : "none",
          transition: "all 0.25s ease"
        }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--color-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-surface)" }}>
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt="You" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <User size={32} color="var(--color-text-muted)" />
            )}
          </div>

          {/* Small + Icon Badge for Quick Creation */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateModal(true);
            }}
            style={{
              position: "absolute", bottom: "0", right: "0", width: "22px", height: "22px",
              backgroundColor: "var(--color-primary, #1d9bf0)", color: "white", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid var(--color-bg-base)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
            title="Create Story"
          >
            <Plus size={14} strokeWidth={3} />
          </div>
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-main)", fontWeight: 600 }}>Your Story</span>
      </div>

      {/* 2. Followed Creators Active Stories (Dost Widescreen Glow Accent Ring) */}
      {groupedStories.map((group, index) => {
        if (group.user.id === currentUserId) return null;

        return (
          <div 
            key={group.user.id} 
            onClick={() => handleStoryGroupClick(index)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", flexShrink: 0 }}
            className="hover-scale"
          >
            <div style={{ 
              position: "relative", width: "66px", height: "66px", borderRadius: "50%", padding: "3px", 
              background: "linear-gradient(45deg, var(--color-primary, #1d9bf0), #00c6ff)",
              boxShadow: "0 0 14px rgba(29, 155, 240, 0.35)",
              transition: "all 0.25s ease"
            }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--color-bg-base)" }}>
                {group.user.avatar ? (
                  <img src={group.user.avatar} alt={group.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    {group.user.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-main)", fontWeight: 500, maxWidth: "64px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {group.user.name.split(" ")[0]}
            </span>
          </div>
        );
      })}

      {/* Story Viewer Component */}
      {activeStoryGroupIndex !== null && (
        <StoryViewer 
          groupedStories={groupedStories} 
          initialGroupIndex={activeStoryGroupIndex}
          onClose={handleCloseViewer}
          onOpenCreateStory={(prompt) => {
            setChainPrompt(prompt);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <CreateStoryModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
