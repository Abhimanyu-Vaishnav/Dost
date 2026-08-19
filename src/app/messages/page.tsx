"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MessageSquare,
  Sparkles,
  Zap,
  Shield,
  Phone,
  Video,
} from "lucide-react";
import { NewChatModal } from "@/features/messages/components/NewChatModal";
import { useSSEPresence } from "@/hooks/useSSEPresence";
import { useRouter } from "next/navigation";
import styles from "./messages.module.css";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const router = useRouter();

  const { presenceMap, typingMap, registerMessageListener } = useSSEPresence(currentUserId);

  useEffect(() => {
    fetch("/api/users/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(() => {});

    fetchConversations();
    fetchSuggestions();
  }, []);

  const fetchConversations = async () => {
    try {
      setError(null);
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to load conversations");
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setError("Network error while loading messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/users/search?q=");
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data.users || []);
      }
    } catch (err) {
      console.error("Fetch suggestions error:", err);
    }
  };

  useEffect(() => {
    if (!registerMessageListener) return;
    const unbind = registerMessageListener(() => {
      fetchConversations();
    });
    return unbind;
  }, [registerMessageListener]);

  const filteredConversations = (conversations || []).filter((c) => {
    const name = c?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.container}>
      {/* LEFT COLUMN: Sidebar with List & Online Connections */}
      <div className={styles.sidebar}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>
              Messages
              <Sparkles size={16} style={{ color: "#00f2fe" }} />
            </h1>
            <span className={styles.subtitle}>Real-time messaging & connections</span>
          </div>

          <button onClick={() => setIsModalOpen(true)} className={styles.newChatBtn}>
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <Search size={16} style={{ color: "#94a3b8" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats or friends..."
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Online Friends Carousel */}
        {suggestedUsers.length > 0 && (
          <div className={styles.onlineSection}>
            <span className={styles.sectionLabel}>Online Friends</span>
            <div className={styles.onlineList}>
              {suggestedUsers.slice(0, 10).map((u) => {
                const isOnline = presenceMap[u.id]?.isOnline ?? true;
                return (
                  <div
                    key={u.id}
                    onClick={() => setIsModalOpen(true)}
                    className={styles.onlineUserItem}
                  >
                    <div className={styles.onlineAvatarRing}>
                      <img
                        src={
                          u.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            u.name || "User"
                          )}`
                        }
                        alt={u.name || "User"}
                        className={styles.onlineAvatarImg}
                        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                      />
                      {isOnline && <span className={styles.onlineGreenDot} />}
                    </div>
                    <span className={styles.onlineUserName}>
                      {u.name?.split(" ")[0] || "User"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className={styles.conversationsList}>
          {loading && (
            <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>
              Loading messages...
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: 20, textAlign: "center" }}>
              <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: 10 }}>{error}</p>
              <button
                onClick={fetchConversations}
                style={{
                  padding: "6px 14px",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#fff",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredConversations.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: "rgba(0, 242, 254, 0.1)",
                  color: "#00f2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                }}
              >
                <MessageSquare size={24} />
              </div>
              <h4 style={{ color: "#f1f5f9", margin: "0 0 4px 0", fontSize: "0.9rem" }}>No conversations yet</h4>
              <p style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 16 }}>
                Connect with friends and start chatting.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className={styles.newChatBtn}
                style={{ margin: "0 auto" }}
              >
                Start First Chat
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredConversations.length > 0 &&
            filteredConversations.map((conv) => {
              const partnerId = conv?.partner?.id;
              const isOnline = partnerId
                ? presenceMap[partnerId]?.isOnline ?? conv?.partner?.isOnline
                : false;
              const isTyping = partnerId ? typingMap[partnerId] === conv.id : false;
              const unread = conv.unreadCount || 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/messages/${conv.id}`)}
                  className={styles.conversationItem}
                >
                  <div className={styles.avatarWrapper}>
                    <img
                      src={conv.avatar || "https://ui-avatars.com/api/?name=User"}
                      alt={conv.name || "User"}
                      className={styles.avatarImg}
                      style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover" }}
                    />
                    {isOnline && <span className={styles.onlineGreenDot} />}
                  </div>

                  <div className={styles.convContent}>
                    <div className={styles.convHeader}>
                      <span className={styles.convName}>{conv.name || "User"}</span>
                      {conv.updatedAt && (
                        <span className={styles.convTime}>
                          {new Date(conv.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    <div className={styles.convSub}>
                      <span className={styles.convMessage}>
                        {isTyping ? (
                          <span style={{ color: "#00f2fe", fontWeight: 600 }}>typing...</span>
                        ) : (
                          conv.lastMessage?.content || "Click to start chatting"
                        )}
                      </span>
                      {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* RIGHT COLUMN: Desktop Hero Welcome Pane */}
      <div className={styles.heroPane}>
        <div className={styles.heroCard}>
          <div className={styles.heroIconWrapper}>
            <MessageSquare size={36} />
          </div>

          <h2 className={styles.heroTitle}>DOST Instant Messages</h2>
          <p className={styles.heroText}>
            Select a conversation on the left or tap below to start a new chat with your friends in real-time.
          </p>

          <button onClick={() => setIsModalOpen(true)} className={styles.heroStartBtn}>
            Start New Conversation
          </button>

          <div className={styles.featuresGrid}>
            <div className={styles.featureBox}>
              <Zap size={18} style={{ color: "#00f2fe" }} />
              <div>
                <div className={styles.featureTitle}>Instant SSE</div>
                <div className={styles.featureDesc}>Real-time delivery</div>
              </div>
            </div>

            <div className={styles.featureBox}>
              <Shield size={18} style={{ color: "#10b981" }} />
              <div>
                <div className={styles.featureTitle}>Read Receipts</div>
                <div className={styles.featureDesc}>Live blue checkmarks</div>
              </div>
            </div>

            <div className={styles.featureBox}>
              <Phone size={18} style={{ color: "#3b82f6" }} />
              <div>
                <div className={styles.featureTitle}>Voice Calls</div>
                <div className={styles.featureDesc}>HD WebRTC Audio</div>
              </div>
            </div>

            <div className={styles.featureBox}>
              <Video size={18} style={{ color: "#a855f7" }} />
              <div>
                <div className={styles.featureTitle}>Video Calls</div>
                <div className={styles.featureDesc}>HD WebRTC Video</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
