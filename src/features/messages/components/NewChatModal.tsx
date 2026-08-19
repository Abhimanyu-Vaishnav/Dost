"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, UserPlus, MessageSquare, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("User search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 200);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleStartChat = async (targetUserId: string) => {
    try {
      setStartingChatId(targetUserId);
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        const data = await res.json();
        onClose();
        router.push(`/messages/${data.conversation.id}`);
      }
    } catch (err) {
      console.error("Start chat error:", err);
    } finally {
      setStartingChatId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: "rgba(5, 7, 10, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "#0d1017",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "24px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#f8fafc",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <MessageSquare size={18} style={{ color: "#00f2fe" }} />
                  New Conversation
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "2px 0 0 0" }}>
                  Select a friend or follower to start chatting
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "10px 14px",
                  borderRadius: "14px",
                }}
              >
                <Search size={16} style={{ color: "#94a3b8" }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search followers or friends..."
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Subtitle */}
            <div
              style={{
                padding: "12px 20px 4px 20px",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Users size={13} style={{ color: "#00f2fe" }} />
              {query ? "Search Results" : "Your Followers & Following"}
            </div>

            {/* Users List */}
            <div style={{ maxHeight: "320px", overflowY: "auto", padding: "8px 12px" }}>
              {loading && (
                <div style={{ padding: "24px", textAlign: "center", fontSize: "0.8rem", color: "#94a3b8" }}>
                  Loading connections...
                </div>
              )}

              {!loading && users.length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", fontSize: "0.8rem", color: "#94a3b8" }}>
                  No followers or matching people found.
                </div>
              )}

              {!loading &&
                users.length > 0 &&
                users.map((u) => (
                  <motion.div
                    key={u.id}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStartChat(u.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      cursor: "pointer",
                      marginBottom: 4,
                      transition: "background 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <img
                        src={
                          u.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            u.name || u.username || "User"
                          )}`
                        }
                        alt={u.name || "User"}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                        }}
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#f1f5f9" }}>
                          {u.name || u.username || "User"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          @{u.username || "user"}
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={startingChatId === u.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        background: "rgba(0, 242, 254, 0.15)",
                        border: "1px solid rgba(0, 242, 254, 0.3)",
                        color: "#00f2fe",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                    >
                      {startingChatId === u.id ? (
                        <span>Opening...</span>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Chat</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
