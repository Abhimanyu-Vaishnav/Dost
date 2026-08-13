"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Send, Image as ImageIcon, Smile, Mic, Phone, Video, 
  Search, Plus, MoreVertical, CheckCheck, Sparkles, MessageCircle, X, ArrowLeft
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import styles from "./messages.module.css";
import { CallModal } from "./CallModal";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
  timestamp: string;
  isMe: boolean;
  reactions?: string[];
}

interface Conversation {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  lastTime: string;
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    name: "Shalini Goyal",
    username: "goyalshaliniuk",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    isOnline: true,
    unreadCount: 2,
    lastMessage: "The new DOST Shorts update looks incredible! 🔥",
    lastTime: "12:45 PM"
  },
  {
    id: "conv-2",
    name: "Devansh Nambiar",
    username: "dev_sound",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    isOnline: true,
    unreadCount: 0,
    lastMessage: "Check out this new lofi track for the Audio Space",
    lastTime: "11:20 AM"
  },
  {
    id: "conv-3",
    name: "Arjun Singhania",
    username: "arjun_arch",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    isOnline: false,
    unreadCount: 0,
    lastMessage: "Thanks for sharing the Blender 3D motion loop tips",
    lastTime: "Yesterday"
  },
  {
    id: "conv-4",
    name: "Simran Kulkarni",
    username: "simrank",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    isOnline: true,
    unreadCount: 1,
    lastMessage: "Are we hosting the next Audio Space at 6 PM?",
    lastTime: "2 days ago"
  }
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  "conv-1": [
    { id: "m1", senderId: "conv-1", senderName: "Shalini Goyal", text: "Hey Abhimanyu! How's the DOST application build coming along?", timestamp: "12:40 PM", isMe: false },
    { id: "m2", senderId: "me", senderName: "You", text: "It's going amazing! Just deployed infinite feed scroll and particle explosions 🚀", timestamp: "12:42 PM", isMe: true, reactions: ["🔥"] },
    { id: "m3", senderId: "conv-1", senderName: "Shalini Goyal", text: "The new DOST Shorts update looks incredible! 🔥", timestamp: "12:45 PM", isMe: false, reactions: ["❤️"] }
  ],
  "conv-2": [
    { id: "m4", senderId: "conv-2", senderName: "Devansh Nambiar", text: "Hey, check out this new lofi track for the Audio Space", timestamp: "11:20 AM", isMe: false }
  ]
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: "voice" | "video"; contact: any } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select first conversation on Desktop (>650px)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 650 && !activeConvId) {
      setActiveConvId("conv-1");
    }
  }, []);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];
  const activeMessages = activeConvId ? (messagesMap[activeConvId] || []) : [];

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeConvId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, activeConvId]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const currentId = activeConvId;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "me",
      senderName: "You",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true
    };

    setMessagesMap(prev => ({
      ...prev,
      [currentId]: [...(prev[currentId] || []), newMsg]
    }));

    setConversations(prev => prev.map(c => {
      if (c.id === currentId) {
        return { ...c, lastMessage: inputText.trim(), lastTime: "Just now", unreadCount: 0 };
      }
      return c;
    }));

    setInputText("");

    // Simulate real-time automated reply after 1.5 seconds
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          senderId: activeConv.id,
          senderName: activeConv.name,
          text: `Awesome! Received your update: "${newMsg.text}" 👍`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isMe: false
        };
        setMessagesMap(prev => ({
          ...prev,
          [currentId]: [...(prev[currentId] || []), replyMsg]
        }));
      }, 1400);
    }, 800);
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    if (!activeConvId) return;
    setMessagesMap(prev => ({
      ...prev,
      [activeConvId]: (prev[activeConvId] || []).map(m => {
        if (m.id === msgId) {
          const currentReactions = m.reactions || [];
          return {
            ...m,
            reactions: currentReactions.includes(emoji)
              ? currentReactions.filter(r => r !== emoji)
              : [...currentReactions, emoji]
          };
        }
        return m;
      })
    }));
  };

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout fullWidth>
      <div className={styles.container}>
        {/* Left Sidebar Conversation List */}
        <div className={`${styles.sidebar} ${activeConvId ? styles.sidebarHiddenMobile : ""}`}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              Messages
            </h2>
            <button style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(29, 155, 240, 0.1)", color: "var(--color-primary)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Plus size={18} />
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ padding: "12px 16px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "var(--color-bg-base)", padding: "10px 14px",
              borderRadius: "9999px", border: "1px solid var(--color-border)"
            }}>
              <Search size={16} style={{ color: "var(--color-text-muted)" }} />
              <input
                type="text"
                placeholder="Search Direct Messages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: "none", border: "none", color: "var(--color-text-main)",
                  outline: "none", fontSize: "0.9rem", width: "100%"
                }}
              />
            </div>
          </div>

          {/* Conversation Items */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredConversations.map(conv => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    cursor: "pointer",
                    backgroundColor: isActive ? "rgba(29, 155, 240, 0.08)" : "transparent",
                    borderLeft: isActive ? "3px solid var(--color-primary)" : "3px solid transparent",
                    transition: "background-color 0.15s ease"
                  }}
                  className="hover-bg"
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    {conv.isOnline && (
                      <span style={{
                        position: "absolute", bottom: "1px", right: "1px",
                        width: "12px", height: "12px", borderRadius: "50%",
                        backgroundColor: "#10b981", border: "2px solid var(--color-bg-surface)"
                      }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-text-main)" }}>
                        {conv.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {conv.lastTime}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: "0.85rem", color: "var(--color-text-muted)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {conv.lastMessage}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span style={{
                          background: "var(--color-primary)", color: "white",
                          fontSize: "0.7rem", fontWeight: 800, padding: "2px 7px",
                          borderRadius: "99px", flexShrink: 0
                        }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Chat Window */}
        <div className={`${styles.chatWindow} ${!activeConvId ? styles.chatWindowHiddenMobile : ""}`}>
          {activeConvId ? (
            <>
              {/* Chat Window Top Bar */}
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--color-bg-surface)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Back Arrow for Mobile Screen */}
                  <button 
                    onClick={() => setActiveConvId(null)}
                    className={styles.backBtn}
                    title="Back to conversations"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <img
                    src={activeConv.avatar}
                    alt={activeConv.name}
                    style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                      {activeConv.name}
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: activeConv.isOnline ? "#10b981" : "var(--color-text-muted)", fontWeight: 600 }}>
                      {activeConv.isOnline ? "Active now" : "Offline"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button 
                    onClick={() => setActiveCall({ type: "voice", contact: activeConv })}
                    style={{ background: "rgba(29, 155, 240, 0.1)", border: "none", color: "var(--color-primary)", cursor: "pointer", padding: "8px", borderRadius: "50%" }} 
                    className="hover:scale-105 active:scale-95"
                    title="Start Voice Call"
                  >
                    <Phone size={19} />
                  </button>
                  <button 
                    onClick={() => setActiveCall({ type: "video", contact: activeConv })}
                    style={{ background: "rgba(168, 85, 247, 0.1)", border: "none", color: "#a855f7", cursor: "pointer", padding: "8px", borderRadius: "50%" }} 
                    className="hover:scale-105 active:scale-95"
                    title="Start Video Call"
                  >
                    <Video size={19} />
                  </button>
                  <button style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "8px" }} className="hover-bg-circle">
                    <MoreVertical size={19} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                {activeMessages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: msg.isMe ? "flex-end" : "flex-start",
                      gap: "4px"
                    }}
                  >
                    <div style={{
                      maxWidth: "82%",
                      padding: "12px 16px",
                      borderRadius: msg.isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                      backgroundColor: msg.isMe ? "var(--color-primary, #1d9bf0)" : "var(--color-bg-surface)",
                      color: msg.isMe ? "#ffffff" : "var(--color-text-main)",
                      border: msg.isMe ? "none" : "1px solid var(--color-border)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      fontSize: "0.95rem",
                      lineHeight: "1.45",
                      position: "relative"
                    }}>
                      {msg.text}

                      {/* Reaction Badges */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div style={{
                          position: "absolute",
                          bottom: "-12px",
                          right: msg.isMe ? "auto" : "12px",
                          left: msg.isMe ? "12px" : "auto",
                          background: "var(--color-bg-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "99px",
                          padding: "1px 6px",
                          fontSize: "0.75rem",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                        }}>
                          {msg.reactions.join(" ")}
                        </div>
                      )}
                    </div>

                    {/* Message Timestamp & Reactions Picker */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                      <span>{msg.timestamp}</span>
                      {msg.isMe && <CheckCheck size={14} style={{ color: "var(--color-primary)" }} />}
                      <button 
                        onClick={() => handleAddReaction(msg.id, "❤️")} 
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", opacity: 0.7 }}
                        title="React ❤️"
                      >
                        ❤️
                      </button>
                      <button 
                        onClick={() => handleAddReaction(msg.id, "🔥")} 
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", opacity: 0.7 }}
                        title="React 🔥"
                      >
                        🔥
                      </button>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: 600 }}>{activeConv.name} is typing...</span>
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>•</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Chat Input Form */}
              <form
                onSubmit={handleSendMessage}
                className={styles.inputForm}
              >
                <button type="button" style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", padding: "6px" }} className="hover-bg-circle">
                  <ImageIcon size={20} />
                </button>
                <button type="button" style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", padding: "6px" }} className="hover-bg-circle">
                  <Mic size={20} />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${activeConv.name}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px 18px",
                    borderRadius: "9999px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-base)",
                    color: "var(--color-text-main)",
                    fontSize: "0.95rem",
                    outline: "none"
                  }}
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  style={{
                    width: "44px", height: "44px", borderRadius: "50%",
                    background: inputText.trim() ? "var(--color-primary)" : "var(--color-border)",
                    color: "white", border: "none", cursor: inputText.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                    flexShrink: 0
                  }}
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              height: "100%", padding: "40px", textAlign: "center", color: "var(--color-text-muted)"
            }}>
              <MessageCircle size={48} style={{ color: "var(--color-primary)", marginBottom: "16px" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
                Select a conversation
              </h3>
              <p style={{ fontSize: "0.9rem", maxWidth: "300px" }}>
                Choose from your existing messages or start a new conversation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Voice or Video Call Modal Overlay */}
      {activeCall && (
        <CallModal
          type={activeCall.type}
          contact={activeCall.contact}
          onEndCall={() => setActiveCall(null)}
        />
      )}
    </AppLayout>
  );
}
