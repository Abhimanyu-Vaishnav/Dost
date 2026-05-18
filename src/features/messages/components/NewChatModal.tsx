"use client";

import { useState, useEffect } from "react";
import { Search, X, Loader2, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export function NewChatModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    const debounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleStartChat = async (userId: string) => {
    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId })
      });
      if (res.ok) {
        const data = await res.json();
        onClose();
        router.push(`/messages/${data.conversationId}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div className="glass animate-scale-in" style={{
        width: "90%", maxWidth: "500px", borderRadius: "24px",
        background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
        display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "80vh",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--color-border)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>New Message</h2>
          <button onClick={onClose} style={{
            background: "var(--color-bg-base)", border: "none", color: "var(--color-text-main)",
            cursor: "pointer", width: "36px", height: "36px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center"
          }} className="hover-bg">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", background: "var(--color-bg-base)",
            padding: "12px 16px", borderRadius: "16px", border: "1px solid var(--color-border)"
          }}>
            <Search size={20} color="var(--color-text-muted)" />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1, background: "transparent", border: "none", color: "var(--color-text-main)",
                outline: "none", fontSize: "1rem"
              }}
            />
            {isLoading && <Loader2 size={18} className="animate-spin" color="var(--color-primary)" />}
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0", minHeight: "200px" }}>
          {!query.trim() && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
              <MessageSquare size={40} style={{ opacity: 0.5, marginBottom: "16px" }} />
              <p>Type a name to search for someone to chat with.</p>
            </div>
          )}

          {query.trim() && users.length === 0 && !isLoading && (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)" }}>
              No users found matching "{query}"
            </div>
          )}

          {users.map(user => (
            <div 
              key={user.id} 
              onClick={() => handleStartChat(user.id)}
              className="hover-bg"
              style={{
                display: "flex", alignItems: "center", gap: "16px", padding: "12px 24px",
                cursor: "pointer", transition: "background 0.2s"
              }}
            >
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%", background: "var(--color-primary)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0,
                overflow: "hidden"
              }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--color-text-main)", fontSize: "1.05rem" }}>{user.name}</p>
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>@{user.name?.toLowerCase().replace(/\s+/g, '')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
