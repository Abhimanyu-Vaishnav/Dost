"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FollowButton } from "./FollowButton";
import { EditProfileModal } from "./EditProfileModal";
import { StoryViewer } from "@/features/stories/components/StoryViewer";
import { MoreHorizontal, VolumeX, Ban, Calendar, MessageSquare, CheckCircle2, User, Play, X, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileHeaderProps {
  user: any;
  isOwnProfile: boolean;
  initialIsFollowing: boolean;
}

export function ProfileHeader({ user, isOwnProfile, initialIsFollowing }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // Story & Profile Picture Viewers
  const [hasActiveStory, setHasActiveStory] = useState(false);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);

  const router = useRouter();

  // Check active stories for target profile user on mount
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/stories/user/${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.hasActiveStory && data.stories?.length > 0) {
            setHasActiveStory(true);
            setUserStories(data.stories);
          } else {
            setHasActiveStory(false);
            setUserStories([]);
          }
        })
        .catch(e => console.error("Error checking stories:", e));
    }
  }, [user?.id]);

  const handleAvatarClick = () => {
    if (hasActiveStory) {
      setShowAvatarMenu(true);
    } else {
      setShowPhotoViewer(true);
    }
  };

  const handleMute = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/mute`, { method: "POST" });
      if (res.ok) {
        alert("User muted!");
        setShowMoreMenu(false);
        router.refresh();
      }
    } catch (e) { console.error(e); }
  };

  const handleBlock = async () => {
    if (!confirm("Are you sure you want to block this user?")) return;
    try {
      const res = await fetch(`/api/users/${user.id}/block`, { method: "POST" });
      if (res.ok) {
        alert("User blocked!");
        setShowMoreMenu(false);
        router.refresh();
      }
    } catch (e) { console.error(e); }
  };

  const formattedJoinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Format ONLY chosen sub-category tags — NEVER force "Influencer"
  const getCategoryBadgeLabel = (accountSubType?: string | null) => {
    if (!accountSubType || !accountSubType.trim()) return null;

    const cleanType = accountSubType.toLowerCase().trim();
    const formatted = accountSubType
      .split("_")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    if (cleanType.includes("developer") || cleanType.includes("engineer")) return `💻 ${formatted}`;
    if (cleanType.includes("teacher") || cleanType.includes("educator")) return `🎓 ${formatted}`;
    if (cleanType.includes("designer")) return `🎨 ${formatted}`;
    if (cleanType.includes("founder")) return `🚀 ${formatted}`;
    if (cleanType.includes("ai") || cleanType.includes("researcher")) return `🤖 ${formatted}`;
    if (cleanType.includes("creator")) return `✨ ${formatted}`;
    if (cleanType.includes("influencer")) return `🌟 ${formatted}`;
    if (cleanType.includes("photographer")) return `📸 ${formatted}`;
    if (cleanType.includes("animator") || cleanType.includes("3d")) return `🎬 ${formatted}`;
    if (cleanType.includes("musician") || cleanType.includes("producer")) return `🎵 ${formatted}`;
    if (cleanType.includes("trainer") || cleanType.includes("fitness")) return `🏋️ ${formatted}`;
    if (cleanType.includes("analyst") || cleanType.includes("financial")) return `📊 ${formatted}`;
    if (cleanType.includes("architect")) return `🏛️ ${formatted}`;
    if (cleanType.includes("company") || cleanType.includes("startup") || cleanType.includes("business")) return `🏢 ${formatted}`;
    
    return `🏷️ ${formatted}`;
  };

  const categoryBadge = getCategoryBadgeLabel(user.accountSubType);
  const isVerified = user.isVerified || user.accountType === "PREMIUM" || user.accountType === "VERIFIED";

  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      {/* Cover Banner: Strict 3:1 Aspect Ratio Box */}
      <div style={{ 
        width: "100%", 
        height: "200px", 
        maxHeight: "220px",
        background: "var(--color-primary-light)", 
        position: "relative", 
        overflow: "hidden"
      }}>
        {user.coverImage ? (
          <img 
            src={user.coverImage} 
            alt="Cover Banner" 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              objectPosition: "center",
              display: "block"
            }} 
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(45deg, var(--color-primary), var(--color-primary-light))" }} />
        )}
      </div>

      <div style={{ padding: "0 16px", position: "relative" }}>
        {/* Top Section: Avatar and Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
          
          {/* Avatar Container with Active Story Ring & Interactive Lightbox Trigger */}
          <div style={{ position: "relative", marginTop: "-68px", zIndex: 2 }}>
            <div 
              onClick={handleAvatarClick}
              style={{
                width: "140px", height: "140px", borderRadius: "50%",
                padding: hasActiveStory ? "3px" : "0",
                background: hasActiveStory 
                  ? "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)"
                  : "transparent",
                cursor: "pointer", transition: "transform 0.2s ease"
              }}
              className="hover-scale"
              title={hasActiveStory ? "Click to view Story or Profile Picture" : "Click to view Profile Picture"}
            >
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%", border: "4px solid var(--color-bg-base)",
                backgroundColor: "var(--color-primary)", color: "white", fontSize: "3.5rem",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                overflow: "hidden", background: "var(--color-bg-base)", boxShadow: "0 4px 14px rgba(0,0,0,0.3)"
              }}>
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} 
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                     {user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>
            </div>

            {/* Glassmorphic Dropdown Menu (If Active Story Exists) */}
            {showAvatarMenu && (
              <div 
                style={{
                  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                  zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
                }}
                onClick={() => setShowAvatarMenu(false)}
              >
                <div 
                  className="glass animate-scale-in"
                  style={{
                    width: "100%", maxWidth: "320px", background: "var(--color-bg-surface)",
                    borderRadius: "24px", padding: "16px", border: "1px solid var(--color-border)",
                    display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <h4 style={{ margin: "4px 0 12px", textAlign: "center", fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                    Profile Options
                  </h4>

                  <button
                    onClick={() => {
                      setShowAvatarMenu(false);
                      setShowStoryViewer(true);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px", width: "100%",
                      padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--color-border)",
                      background: "linear-gradient(45deg, rgba(220, 39, 67, 0.15), rgba(188, 24, 136, 0.15))",
                      color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer"
                    }}
                    className="hover-bg"
                  >
                    <Play size={20} style={{ color: "#dc2743" }} /> View Story
                  </button>

                  <button
                    onClick={() => {
                      setShowAvatarMenu(false);
                      setShowPhotoViewer(true);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px", width: "100%",
                      padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--color-border)",
                      background: "var(--color-bg-base)", color: "var(--color-text-main)",
                      fontWeight: 700, fontSize: "0.95rem", cursor: "pointer"
                    }}
                    className="hover-bg"
                  >
                    <Eye size={20} style={{ color: "var(--color-primary)" }} /> View Profile Picture
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", paddingBottom: "12px" }}>
            {isOwnProfile ? (
              <button 
                onClick={() => setShowEditModal(true)}
                style={{
                  padding: "10px 24px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)",
                  background: "transparent", color: "var(--color-text-main)", fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", transition: "all 0.2s"
                }}
                className="hover-bg"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <button 
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    className="hover-bg"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {showMoreMenu && (
                    <div className="glass animate-scale-in responsive-dropdown-menu" style={{
                      position: "absolute", right: 0, top: "110%", zIndex: 100,
                      display: "flex", flexDirection: "column", minWidth: "220px",
                      padding: "8px", borderRadius: "16px", gap: "4px",
                      border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)",
                      background: "var(--color-bg-surface)"
                    }}>
                      <button onClick={handleMute} style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "12px", textAlign: "left", fontWeight: 600 }} className="hover-bg">
                        <VolumeX size={18} /> Mute @{user.name}
                      </button>
                      <button onClick={handleBlock} style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", padding: "12px", borderRadius: "12px", textAlign: "left", fontWeight: 600 }} className="hover-bg">
                        <Ban size={18} /> Block @{user.name}
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/conversations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ targetUserId: user.id }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        router.push(`/messages/${data.conversation.id}`);
                      }
                    } catch (err) {
                      console.error("Start chat error:", err);
                    }
                  }}
                  style={{
                    width: "40px", height: "40px", borderRadius: "50%", border: "1px solid var(--color-border)",
                    background: "transparent", color: "var(--color-text-main)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  className="hover-bg"
                  title="Message"
                >
                  <MessageSquare size={20} />
                </button>
                <FollowButton userId={user.id} initialIsFollowing={initialIsFollowing} />
              </>
            )}
          </div>
        </div>

        {/* User Info Section */}
        <div style={{ marginBottom: "20px" }}>
          {/* Display Name Row: Verified Blue Tick Badge sits right next to Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>{user.name}</h1>
            {isVerified && (
              <CheckCircle2 size={18} style={{ color: "var(--color-primary, #1d9bf0)", fill: "var(--color-primary, #1d9bf0)", stroke: "var(--color-bg-base)" }} />
            )}
          </div>
          
          <p className="text-muted" style={{ fontSize: "0.95rem", margin: "0 0 6px" }}>
            @{user.username || user.name?.toLowerCase().replace(/\s+/g, '')}
          </p>

          {/* Account Sub-Category Badge: Light Grey Pill */}
          {categoryBadge && (
            <div style={{ marginBottom: "12px" }}>
              <span style={{
                padding: "4px 12px",
                borderRadius: "99px",
                fontSize: "0.8rem",
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}>
                {categoryBadge}
              </span>
            </div>
          )}
          
          <div style={{ fontSize: "1.05rem", color: "var(--color-text-main)", marginBottom: "16px", whiteSpace: "pre-wrap" }}>
            {user.bio || "No bio yet"}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={18} />
              Joined {formattedJoinDate}
            </div>
          </div>
        </div>

        {/* Stats Section: Clickable Following & Followers */}
        <div style={{ display: "flex", gap: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <Link href={`/profile/${user.id}/follow?tab=following`} style={{ textDecoration: "none" }} className="hover-underline">
            <span style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "1.1rem" }}>{user._count?.following || 0}</span>
            <span className="text-muted" style={{ marginLeft: "4px" }}>Following</span>
          </Link>
          <Link href={`/profile/${user.id}/follow?tab=followers`} style={{ textDecoration: "none" }} className="hover-underline">
            <span style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "1.1rem" }}>{user._count?.followers || 0}</span>
            <span className="text-muted" style={{ marginLeft: "4px" }}>Followers</span>
          </Link>
        </div>

        {/* Story Highlights Section */}
        <div style={{ display: "flex", gap: "16px", padding: "16px 0 6px", overflowX: "auto", scrollbarWidth: "none" }}>
          {[
            { id: "h1", title: "✨ Highlights", emoji: "✨", bg: "var(--color-primary-light)" },
            { id: "h2", title: "💻 Tech", emoji: "💻", bg: "rgba(29, 155, 240, 0.15)" },
            { id: "h3", title: "✈️ Travel", emoji: "✈️", bg: "rgba(255, 170, 0, 0.15)" },
            { id: "h4", title: "🎵 Music", emoji: "🎵", bg: "rgba(235, 64, 52, 0.15)" }
          ].map((hl) => (
            <div key={hl.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", flexShrink: 0 }} className="hover-scale">
              <div style={{
                width: "60px", height: "60px", borderRadius: "50%", border: "2px solid var(--color-border)",
                background: hl.bg, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}>
                {hl.emoji}
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-main)" }}>{hl.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />
      )}

      {/* Fullscreen View Profile Picture Lightbox */}
      {showPhotoViewer && (
        <div 
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 2000, background: "rgba(0, 0, 0, 0.92)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
          }}
          onClick={() => setShowPhotoViewer(false)}
        >
          <button 
            onClick={() => setShowPhotoViewer(false)}
            style={{
              position: "absolute", top: "20px", right: "20px",
              background: "rgba(255,255,255,0.15)", border: "none", color: "white",
              width: "44px", height: "44px", borderRadius: "50%", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <X size={24} />
          </button>

          <div style={{ maxWidth: "500px", maxHeight: "500px", width: "90vw", height: "90vw", borderRadius: "50%", overflow: "hidden", border: "4px solid rgba(255,255,255,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "5rem", fontWeight: 800 }}>
                {user.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Story Viewer (When Story Option Clicked) */}
      {showStoryViewer && userStories.length > 0 && (
        <StoryViewer 
          groupedStories={[{
            user: { id: user.id, name: user.name || "User", avatar: user.avatar },
            stories: userStories
          }]}
          initialGroupIndex={0}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
    </div>
  );
}
