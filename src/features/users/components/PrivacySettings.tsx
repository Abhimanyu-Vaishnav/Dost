"use client";

import { useState } from "react";
import { Volume2, Ban, Eye, EyeOff, VolumeX, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PrivacySettingsProps {
  mutedUsers: any[];
  blockedUsers: any[];
  hiddenPosts: any[];
  currentUserId: string;
}

export function PrivacySettings({ mutedUsers, blockedUsers, hiddenPosts, currentUserId }: PrivacySettingsProps) {
  const [activeTab, setActiveTab] = useState<"muted" | "blocked" | "hidden">("hidden");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleUnmute = async (userId: string) => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}/mute`, { method: "POST" });
      if (res.ok) router.refresh();
    } catch (e) { console.error(e); }
    finally { setLoading(null); }
  };

  const handleUnblock = async (userId: string) => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}/block`, { method: "POST" });
      if (res.ok) router.refresh();
    } catch (e) { console.error(e); }
    finally { setLoading(null); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
        <button 
          onClick={() => setActiveTab("hidden")}
          style={{
            flex: 1, padding: "16px", border: "none", background: "none",
            color: activeTab === "hidden" ? "var(--color-primary)" : "var(--color-text-muted)",
            fontWeight: activeTab === "hidden" ? 700 : 500,
            borderBottom: activeTab === "hidden" ? "3px solid var(--color-primary)" : "none",
            cursor: "pointer"
          }}
        >
          Hidden Posts
        </button>
        <button 
          onClick={() => setActiveTab("muted")}
          style={{
            flex: 1, padding: "16px", border: "none", background: "none",
            color: activeTab === "muted" ? "var(--color-primary)" : "var(--color-text-muted)",
            fontWeight: activeTab === "muted" ? 700 : 500,
            borderBottom: activeTab === "muted" ? "3px solid var(--color-primary)" : "none",
            cursor: "pointer"
          }}
        >
          Muted Users
        </button>
        <button 
          onClick={() => setActiveTab("blocked")}
          style={{
            flex: 1, padding: "16px", border: "none", background: "none",
            color: activeTab === "blocked" ? "var(--color-primary)" : "var(--color-text-muted)",
            fontWeight: activeTab === "blocked" ? 700 : 500,
            borderBottom: activeTab === "blocked" ? "3px solid var(--color-primary)" : "none",
            cursor: "pointer"
          }}
        >
          Blocked Users
        </button>
      </div>

      <div style={{ padding: "0 12px" }}>
        {activeTab === "hidden" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
             {hiddenPosts.length === 0 ? (
               <p className="text-muted" style={{ textAlign: "center", padding: "40px" }}>No hidden posts.</p>
             ) : (
               <p className="text-muted" style={{ padding: "12px" }}>Note: You can unhide posts by clicking "Unhide" in the post menu (coming soon or just refresh feed).</p>
             )}
          </div>
        )}

        {activeTab === "muted" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {mutedUsers.length === 0 ? (
              <p className="text-muted" style={{ textAlign: "center", padding: "40px" }}>No muted users.</p>
            ) : (
              mutedUsers.map(m => (
                <div key={m.mutedUser.id} className="glass" style={{ padding: "16px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
                       {m.mutedUser.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.mutedUser.name}</div>
                      <div className="text-muted" style={{ fontSize: "0.85rem" }}>Muted on {new Date(m.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUnmute(m.mutedUser.id)}
                    style={{ padding: "8px 16px", borderRadius: "var(--radius-full)", border: "1px solid #ff4d4d", color: "#ff4d4d", background: "transparent", fontWeight: 600, cursor: "pointer" }}
                    className="hover-bg-error"
                  >
                    {loading === m.mutedUser.id ? <Loader2 size={16} className="animate-spin" /> : "Unmute"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "blocked" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {blockedUsers.length === 0 ? (
              <p className="text-muted" style={{ textAlign: "center", padding: "40px" }}>No blocked users.</p>
            ) : (
              blockedUsers.map(b => (
                <div key={b.blockedUser.id} className="glass" style={{ padding: "16px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#ff4d4d", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
                       {b.blockedUser.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{b.blockedUser.name}</div>
                      <div className="text-muted" style={{ fontSize: "0.85rem" }}>Blocked on {new Date(b.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUnblock(b.blockedUser.id)}
                    style={{ padding: "8px 16px", borderRadius: "var(--radius-full)", border: "1px solid #ff4d4d", color: "white", background: "#ff4d4d", fontWeight: 600, cursor: "pointer" }}
                  >
                    {loading === b.blockedUser.id ? <Loader2 size={16} className="animate-spin" /> : "Unblock"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
