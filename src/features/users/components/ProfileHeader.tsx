"use client";

import { useState } from "react";
import { FollowButton } from "./FollowButton";
import { EditProfileModal } from "./EditProfileModal";
import { Edit2, MoreHorizontal, EyeOff, Ban, VolumeX, Calendar, MapPin, Link as LinkIcon, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileHeaderProps {
  user: any;
  isOwnProfile: boolean;
  initialIsFollowing: boolean;
}

export function ProfileHeader({ user, isOwnProfile, initialIsFollowing }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const router = useRouter();

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

  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      {/* Cover Image Container */}
      <div style={{ height: "200px", width: "100%", background: "var(--color-primary-light)", position: "relative", overflow: "hidden" }}>
        {user.coverImage ? (
          <img src={user.coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(45deg, var(--color-primary), var(--color-primary-light))" }} />
        )}
      </div>

      <div style={{ padding: "0 16px", position: "relative" }}>
        {/* Top Section: Avatar and Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
          {/* Avatar */}
          <div style={{
            width: "140px", height: "140px", borderRadius: "50%", border: "4px solid var(--color-bg-base)",
            backgroundColor: "var(--color-primary)", color: "white", fontSize: "3.5rem",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
            overflow: "hidden", marginTop: "-70px", background: "var(--color-bg-base)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 2
          }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                 {user.name?.charAt(0).toUpperCase() || "?"}
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
                      const res = await fetch("/api/messages/start", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ targetUserId: user.id })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        router.push(`/messages/${data.conversationId}`);
                      }
                    } catch (e) { console.error(e); }
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
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "2px" }}>{user.name}</h1>
          <p className="text-muted" style={{ fontSize: "1rem", marginBottom: "16px" }}>@{user.name?.toLowerCase().replace(/\s+/g, '')}</p>
          
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

        {/* Stats Section */}
        <div style={{ display: "flex", gap: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ cursor: "pointer" }} className="hover-underline">
            <span style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "1.1rem" }}>{user._count?.following || 0}</span>
            <span className="text-muted" style={{ marginLeft: "4px" }}>Following</span>
          </div>
          <div style={{ cursor: "pointer" }} className="hover-underline">
            <span style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "1.1rem" }}>{user._count?.followers || 0}</span>
            <span className="text-muted" style={{ marginLeft: "4px" }}>Followers</span>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  );
}
