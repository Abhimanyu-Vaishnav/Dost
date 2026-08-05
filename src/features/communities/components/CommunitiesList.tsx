"use client";

import { useState } from "react";
import { Users, Plus, Check, Shield } from "lucide-react";
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  coverImage: string | null;
  creator: { name: string; avatar: string | null };
  _count: { members: number; posts: number };
  members: { id: string }[];
}

export function CommunitiesList({ initialCommunities, currentUserId }: { initialCommunities: Community[]; currentUserId: string }) {
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommunities([data.community, ...communities]);
        setShowCreate(false);
        setName("");
        setDescription("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleJoin = async (id: string) => {
    try {
      const res = await fetch(`/api/communities/${id}/join`, { method: "POST" });
      if (res.ok) {
        const { joined } = await res.json();
        setCommunities(communities.map(c => {
          if (c.id === id) {
            const countDiff = joined ? 1 : -1;
            return {
              ...c,
              _count: { ...c._count, members: c._count.members + countDiff },
              members: joined ? [{ id: "temp" }] : [],
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Discover Communities</h2>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>Join interest groups & discussions</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            background: "var(--color-primary)", color: "white", padding: "10px 16px",
            borderRadius: "99px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          <Plus size={18} /> Create Group
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass animate-slide-up" style={{ padding: "20px", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontWeight: 800 }}>New Community</h3>
          <input
            type="text"
            placeholder="Community Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-main)" }}
            required
          />
          <textarea
            placeholder="Description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-main)", minHeight: "80px" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={() => setShowCreate(false)} style={{ color: "var(--color-text-muted)", padding: "8px 16px" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: "var(--color-primary)", color: "white", padding: "8px 20px", borderRadius: "99px", fontWeight: 700 }}>
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {communities.length === 0 ? (
          <div className="glass" style={{ padding: "30px", textAlign: "center", borderRadius: "16px" }}>
            <Users size={32} style={{ color: "var(--color-text-muted)", marginBottom: "8px" }} />
            <p className="text-muted">No communities created yet. Be the first to start one!</p>
          </div>
        ) : (
          communities.map((c) => {
            const isMember = c.members && c.members.length > 0;
            return (
              <div
                key={c.id}
                className="glass"
                style={{ padding: "20px", borderRadius: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem" }}>
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)" }}>{c.name}</h3>
                    {c.description && <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "2px 0 4px 0" }}>{c.description}</p>}
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      {c._count.members} {c._count.members === 1 ? "member" : "members"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleJoin(c.id)}
                  style={{
                    padding: "8px 20px", borderRadius: "99px", fontWeight: 700,
                    background: isMember ? "var(--color-bg-base)" : "var(--color-primary)",
                    color: isMember ? "var(--color-text-main)" : "white",
                    border: isMember ? "1px solid var(--color-border)" : "none",
                    cursor: "pointer"
                  }}
                >
                  {isMember ? "Joined" : "Join"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
