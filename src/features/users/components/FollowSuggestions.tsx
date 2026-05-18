"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
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
    <div className="glass" style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }}>
      <h3 className="text-h3" style={{ marginBottom: "var(--space-4)" }}>Who to follow</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {suggestions.map(user => (
          <div key={user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href={`/profile/${user.id}`} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", textDecoration: "none" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-primary)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600,
                overflow: "hidden"
              }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  user.name ? user.name.charAt(0).toUpperCase() : "?"
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>{user.name}</span>
              </div>
            </Link>
            <button 
              onClick={() => handleFollow(user.id)}
              style={{
                backgroundColor: "var(--color-text-main)", color: "var(--color-bg-base)",
                padding: "8px 16px",
                borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: 700,
                border: "none", cursor: "pointer"
              }}>
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
