"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Users, UserCheck, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FollowButton } from "@/features/users/components/FollowButton";
import { SearchBar } from "@/features/search/components/SearchBar";
import { TrendingSection } from "@/features/search/components/TrendingSection";

export default function FollowConnectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = use(params);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "followers";

  const [activeTab, setActiveTab] = useState<"followers" | "following" | "mutual">(
    initialTab === "following" ? "following" : initialTab === "mutual" ? "mutual" : "followers"
  );
  const [profileUser, setProfileUser] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [mutualFollowers, setMutualFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, followRes] = await Promise.all([
          fetch(`/api/users/${targetUserId}`),
          fetch(`/api/users/${targetUserId}/followers`)
        ]);

        if (profileRes.ok) {
          const pData = await profileRes.json();
          setProfileUser(pData.user);
        }

        if (followRes.ok) {
          const fData = await followRes.json();
          setFollowers(fData.followers || []);
          setFollowing(fData.following || []);
          setMutualFollowers(fData.mutualFollowers || []);
        }
      } catch (e) {
        console.error("Error loading follow connections:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetUserId]);

  const displayedUsers =
    activeTab === "following"
      ? following
      : activeTab === "mutual"
      ? mutualFollowers
      : followers;

  return (
    <AppLayout
      rightSidebar={
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <SearchBar />
          <TrendingSection />
        </div>
      }
    >
      <div style={{ width: "100%", minHeight: "100vh" }}>
        {/* Sticky Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "var(--color-bg-glass)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-border)", padding: "12px 16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
            <Link 
              href={`/profile/${targetUserId}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "36px", height: "36px", borderRadius: "50%",
                background: "var(--color-bg-hover)", color: "var(--color-text-main)"
              }}
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                {profileUser?.name || "User Connections"}
              </h2>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                @{profileUser?.username || "username"}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", borderBottom: "none" }}>
            <button
              onClick={() => setActiveTab("followers")}
              style={{
                flex: 1, padding: "12px 0", background: "none", border: "none",
                fontSize: "0.95rem", fontWeight: activeTab === "followers" ? 800 : 500,
                color: activeTab === "followers" ? "var(--color-text-main)" : "var(--color-text-muted)",
                cursor: "pointer", position: "relative"
              }}
            >
              Followers ({followers.length})
              {activeTab === "followers" && (
                <div style={{
                  position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                  width: "60px", height: "4px", background: "var(--color-primary)", borderRadius: "99px"
                }} />
              )}
            </button>

            <button
              onClick={() => setActiveTab("following")}
              style={{
                flex: 1, padding: "12px 0", background: "none", border: "none",
                fontSize: "0.95rem", fontWeight: activeTab === "following" ? 800 : 500,
                color: activeTab === "following" ? "var(--color-text-main)" : "var(--color-text-muted)",
                cursor: "pointer", position: "relative"
              }}
            >
              Following ({following.length})
              {activeTab === "following" && (
                <div style={{
                  position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                  width: "60px", height: "4px", background: "var(--color-primary)", borderRadius: "99px"
                }} />
              )}
            </button>

            {mutualFollowers.length > 0 && (
              <button
                onClick={() => setActiveTab("mutual")}
                style={{
                  flex: 1, padding: "12px 0", background: "none", border: "none",
                  fontSize: "0.95rem", fontWeight: activeTab === "mutual" ? 800 : 500,
                  color: activeTab === "mutual" ? "var(--color-text-main)" : "var(--color-text-muted)",
                  cursor: "pointer", position: "relative"
                }}
              >
                Mutual ({mutualFollowers.length})
                {activeTab === "mutual" && (
                  <div style={{
                    position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                    width: "60px", height: "4px", background: "var(--color-primary)", borderRadius: "99px"
                  }} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* User Connections List */}
        <div style={{ padding: "8px 0" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-primary)" }} />
            </div>
          ) : displayedUsers.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
              <Users size={36} style={{ margin: "0 auto 12px", color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                No users found
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {activeTab === "followers"
                  ? "No followers yet."
                  : activeTab === "following"
                  ? "Not following anyone yet."
                  : "No mutual connections found."}
              </p>
            </div>
          ) : (
            displayedUsers.map((u) => (
              <div
                key={u.id}
                style={{
                  padding: "16px 20px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: "16px",
                  borderBottom: "1px solid var(--color-border)", transition: "background 0.2s"
                }}
                className="hover-bg"
              >
                <Link
                  href={`/profile/${u.id}`}
                  style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}
                >
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    background: "var(--color-primary-light)", color: "var(--color-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "1.1rem", overflow: "hidden", flexShrink: 0
                  }}>
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      u.name?.charAt(0).toUpperCase() || "?"
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.name}
                      </span>
                      {(u.isVerified || u.accountType === "PREMIUM" || u.accountType === "VERIFIED") && (
                        <CheckCircle2 size={16} style={{ color: "var(--color-primary)", fill: "var(--color-primary)", stroke: "var(--color-bg-base)" }} />
                      )}
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      @{u.username || "user"}
                    </span>
                    {u.bio && (
                      <p style={{
                        margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-main)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {u.bio}
                      </p>
                    )}
                  </div>
                </Link>

                {!u.isSelf && (
                  <FollowButton userId={u.id} initialIsFollowing={u.isFollowing} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
