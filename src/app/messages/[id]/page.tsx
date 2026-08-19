"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { ChatHeader } from "@/features/messages/components/ChatHeader";
import { MessageBubble } from "@/features/messages/components/MessageBubble";
import { ChatInput } from "@/features/messages/components/ChatInput";
import { NewChatModal } from "@/features/messages/components/NewChatModal";
import { useSSEPresence } from "@/hooks/useSSEPresence";
import { useCall } from "@/context/CallContext";
import { Search, Plus, MessageSquare, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../messages.module.css";

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  const router = useRouter();
  const { startCall } = useCall();

  const [conversation, setConversation] = useState<any>(null);
  const [conversationsList, setConversationsList] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // In-chat message search filter
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [chatSearchText, setChatSearchText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { presenceMap, typingMap, sendTyping, registerMessageListener } =
    useSSEPresence(currentUserId);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetch("/api/users/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(() => {});

    fetchConversationsList();
    fetchMessages();
    markAsRead();
  }, [conversationId]);

  const fetchConversationsList = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.conversations) ? data.conversations : [];
        setConversationsList(list);

        const activeConv = list.find((c: any) => c.id === conversationId);
        if (activeConv) {
          setConversation(activeConv);
        }
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/conversations/${conversationId}/messages?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Fetch conversation messages error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!registerMessageListener) return;
    const unbind = registerMessageListener((eventPayload) => {
      if (eventPayload.message && eventPayload.message.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === eventPayload.message.id)) return prev;
          return [...prev, eventPayload.message];
        });
        markAsRead();
      }

      if (eventPayload.event === "message_read" && eventPayload.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (eventPayload.messageIds?.includes(m.id)) {
              return { ...m, status: "READ" };
            }
            return m;
          })
        );
      }

      if (eventPayload.event === "message_edited" && eventPayload.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === eventPayload.messageId ? { ...m, content: eventPayload.newContent } : m
          )
        );
      }

      if (eventPayload.event === "message_deleted" && eventPayload.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === eventPayload.messageId
              ? { ...m, content: "This message was deleted", type: "SYSTEM", mediaUrl: null }
              : m
          )
        );
      }

      fetchConversationsList();
    });

    return unbind;
  }, [conversationId, registerMessageListener]);

  const handleSendMessage = async (payload: {
    content?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
  }) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          ...payload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setReplyTo(null);
        fetchConversationsList();
      }
    } catch (err) {
      console.error("Send message error:", err);
      showToast("Failed to send message");
    }
  };

  const handleSaveEdit = async (messageId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: newContent } : m))
        );
        setEditingMessage(null);
        showToast("Message updated");
      }
    } catch (err) {
      console.error("Save edit error:", err);
    }
  };

  const handleDeleteMessage = async (messageId: string, mode: "everyone" | "me") => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", mode }),
      });

      if (res.ok) {
        if (mode === "everyone") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, content: "This message was deleted", type: "SYSTEM" }
                : m
            )
          );
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        }
        showToast("Message deleted");
      }
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };

  const handleDeleteConversation = async () => {
    if (!confirm("Are you sure you want to delete this entire conversation?")) return;

    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Conversation deleted");
        router.push("/messages");
      } else {
        showToast("Failed to delete conversation");
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
      showToast("Network error");
    }
  };

  const partner = conversation?.partner || {
    id: "",
    name: conversation?.name || "Friend",
    avatar: conversation?.avatar || "https://ui-avatars.com/api/?name=Friend",
  };

  const isPartnerOnline = partner.id ? presenceMap[partner.id]?.isOnline ?? conversation?.partner?.isOnline ?? false : false;
  const isPartnerTyping = partner.id ? typingMap[partner.id] === conversationId : false;

  const filteredConversations = conversationsList.filter((c) =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter messages in current chat if in-chat search active
  const displayedMessages = messages.filter((m) => {
    if (!chatSearchText.trim()) return true;
    return (m.content || "").toLowerCase().includes(chatSearchText.toLowerCase());
  });

  const isChatEmpty = !loading && displayedMessages.length === 0;
  const hasChatMessages = !loading && displayedMessages.length > 0;

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 99999,
              padding: "10px 18px",
              backgroundColor: "#0d1017",
              border: "1px solid rgba(0, 242, 254, 0.4)",
              borderRadius: "12px",
              color: "#00f2fe",
              fontSize: "0.82rem",
              fontWeight: 700,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            {toastMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR: Conversations List */}
      <div className={`${styles.sidebar} ${styles.chatRoomActiveSidebar}`}>
        <div className={styles.sidebarHeader}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", margin: 0 }}>Messages</h2>
          <button onClick={() => setIsModalOpen(true)} className={styles.newChatBtn}>
            <Plus size={14} />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <Search size={15} style={{ color: "#94a3b8" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.conversationsList}>
          {filteredConversations.map((conv) => {
            const pId = conv?.partner?.id;
            const online = pId ? presenceMap[pId]?.isOnline ?? conv?.partner?.isOnline : false;
            const typing = pId ? typingMap[pId] === conv.id : false;
            const isActive = conv.id === conversationId;
            const unread = conv.unreadCount || 0;

            return (
              <motion.div
                key={conv.id}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/messages/${conv.id}`)}
                className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ""}`}
              >
                <div className={styles.avatarWrapper}>
                  <img
                    src={conv.avatar || "https://ui-avatars.com/api/?name=User"}
                    alt={conv.name || "User"}
                    className={styles.avatarImg}
                    style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover" }}
                  />
                  {online ? <span className={styles.onlineGreenDot} /> : null}
                </div>

                <div className={styles.convContent}>
                  <div className={styles.convHeader}>
                    <span className={styles.convName}>{conv.name || "User"}</span>
                    {conv.updatedAt ? (
                      <span className={styles.convTime}>
                        {new Date(conv.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.convSub}>
                    <span className={styles.convMessage}>
                      {typing ? (
                        <span style={{ color: "#00f2fe", fontWeight: 600 }}>typing...</span>
                      ) : (
                        conv.lastMessage?.content || "Click to chat"
                      )}
                    </span>
                    {unread > 0 ? <span className={styles.unreadBadge}>{unread}</span> : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE CHAT WINDOW */}
      <div className={styles.chatWindow}>
        <ChatHeader
          name={partner.name}
          avatar={partner.avatar}
          isOnline={isPartnerOnline}
          lastSeen={partner.id ? presenceMap[partner.id]?.lastSeen : undefined}
          isTyping={isPartnerTyping}
          onVoiceCall={() => partner.id && startCall({ id: partner.id, name: partner.name, avatar: partner.avatar }, "VOICE")}
          onVideoCall={() => partner.id && startCall({ id: partner.id, name: partner.name, avatar: partner.avatar }, "VIDEO")}
          onSearchToggle={() => setIsSearchActive(!isSearchActive)}
          onDeleteChat={handleDeleteConversation}
        />

        {/* IN-CHAT MESSAGE SEARCH BAR OVERLAY */}
        <AnimatePresence>
          {isSearchActive ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                backgroundColor: "rgba(13, 16, 23, 0.95)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <Search size={16} style={{ color: "#00f2fe" }} />
              <input
                type="text"
                value={chatSearchText}
                onChange={(e) => setChatSearchText(e.target.value)}
                placeholder="Search messages in this chat..."
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "0.85rem",
                  outline: "none",
                  width: "100%",
                }}
              />
              <button
                onClick={() => {
                  setIsSearchActive(false);
                  setChatSearchText("");
                }}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className={styles.messagesArea}>
          {loading ? (
            <div style={{ padding: "30px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: i % 2 === 0 ? "60%" : "45%",
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    alignSelf: i % 2 === 0 ? "flex-end" : "flex-start",
                  }}
                />
              ))}
            </div>
          ) : null}

          {isChatEmpty ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#94a3b8" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(0,242,254,0.1)",
                  color: "#00f2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <MessageSquare size={28} />
              </div>
              <h4 style={{ color: "#fff", margin: "0 0 4px 0" }}>
                {chatSearchText ? "No matching messages" : "No messages yet"}
              </h4>
              <p style={{ fontSize: "0.8rem", margin: 0 }}>
                {chatSearchText ? "Try searching for a different keyword." : "Send a message to start chatting 👋"}
              </p>
            </div>
          ) : null}

          {hasChatMessages
            ? displayedMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  id={msg.id}
                  senderId={msg.senderId}
                  senderName={msg.sender?.name || msg.sender?.username}
                  content={msg.content}
                  type={msg.type}
                  mediaUrl={msg.mediaUrl}
                  fileName={msg.fileName}
                  fileSize={msg.fileSize}
                  replyTo={msg.replyTo}
                  status={msg.status}
                  isMe={msg.senderId === currentUserId}
                  createdAt={msg.createdAt}
                  updatedAt={msg.updatedAt}
                  onReply={(m) => setReplyTo(m)}
                  onEdit={(m) => setEditingMessage(m)}
                  onDelete={handleDeleteMessage}
                />
              ))
            : null}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          onTypingStart={() => sendTyping(conversationId, true)}
          onTypingStop={() => sendTyping(conversationId, false)}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onSaveEdit={handleSaveEdit}
        />
      </div>

      <NewChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
