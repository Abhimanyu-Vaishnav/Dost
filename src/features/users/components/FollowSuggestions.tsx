"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function FollowSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/suggestions")
      .then(res => res.json())
      .then(data => {
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFollow = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}/follow`, { method: "POST" });
      if (res.ok) {
        setSuggestions(suggestions.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  return (
    <div style={{
      padding: "16px",
      borderRadius: "16px",
      border: "1px solid var(--color-border)",
      backgroundColor: "var(--color-bg-surface)",
      display: "flex",
      flexDirection: "column",
      gap: "14px"
    }}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
        Who to follow
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {suggestions.map(user => {
          const userHandle = `@${user.username || (user.name ? user.name.toLowerCase().replace(/\s+/g, "") : "user")}`;
          return (
            <div key={user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Link href={`/profile/${user.id}`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", overflow: "hidden" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  backgroundColor: "var(--color-bg-base)", color: "var(--color-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                  overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0
                }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : "?"
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", lineHeight: 1.25 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {userHandle}
                  </span>
                </div>
              </Link>
              <button 
                onClick={() => handleFollow(user.id)}
                style={{
                  backgroundColor: "var(--color-text-main)",
                  color: "var(--color-bg-base)",
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "opacity 0.15s"
                }}
              >
                Follow
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

