"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Send, Image as ImageIcon, Smile, Mic, Phone, Video, 
  Search, Plus, MoreVertical, CheckCheck, Sparkles, MessageCircle, X, ArrowLeft,
  Square, Play, Pause, Trash2, User, Pin, BellOff, Bell, ShieldAlert, Check, Copy, Reply,
  Mail, UserPlus
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import styles from "./messages.module.css";
import { uploadMediaFile } from "@/lib/upload";
import { useCall } from "@/context/CallContext";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp: string;
  isMe: boolean;
  isDelivered?: boolean;
  isRead?: boolean;
}

interface Conversation {
  id: string;
  partnerId?: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  lastTime: string;
}

const AVAILABLE_CONTACTS_DIRECTORY = [
  {
    id: "conv-goyalshaliniuk",
    name: "Shalini Goyal",
    username: "goyalshaliniuk",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    isOnline: true
  },
  {
    id: "conv-dev_sound",
    name: "Devansh Nambiar",
    username: "dev_sound",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    isOnline: true
  },
  {
    id: "conv-arjun_arch",
    name: "Arjun Singhania",
    username: "arjun_arch",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    isOnline: false
  },
  {
    id: "conv-simrank",
    name: "Simran Kulkarni",
    username: "simrank",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    isOnline: true
  },
  {
    id: "conv-sumit",
    name: "Sumit",
    username: "sumit",
    avatar: "https://ui-avatars.com/api/?name=Sumit&background=00f2fe&color=ffffff&bold=true",
    isOnline: true
  }
];

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convIdParam = searchParams?.get("convId");

  const { startCall } = useCall();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(convIdParam || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync ConvId URL parameter
  useEffect(() => {
    if (convIdParam) {
      setActiveConvId(convIdParam);
    }
  }, [convIdParam]);

  // Fetch Conversations List
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
          if (!activeConvId && data.conversations.length > 0 && !convIdParam) {
            setActiveConvId(data.conversations[0].id);
          }
        }
      }
    } catch (e) {}
  };

  // Fetch Messages for Active Conversation
  const fetchMessages = async (cId: string) => {
    try {
      const res = await fetch(`/api/messages?convId=${encodeURIComponent(cId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
        setIsPartnerTyping(Boolean(data.isPartnerTyping));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      const interval = setInterval(() => fetchMessages(activeConvId), 1200);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    router.push(`/messages?convId=${encodeURIComponent(id)}`);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || !activeConvId) return;

    const textToSend = inputText.trim();
    const imageToSend = attachedImage;

    setInputText("");
    setAttachedImage(null);

    // Optimistic Message Append
    const tempMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      senderId: "me",
      senderName: "You",
      text: textToSend || (imageToSend ? "📷 Photo" : ""),
      imageUrl: imageToSend || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
      isDelivered: true,
      isRead: false
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convId: activeConvId,
          text: textToSend,
          imageUrl: imageToSend
        })
      });
      fetchMessages(activeConvId);
      fetchConversations();
    } catch (e) {}
  };

  const filteredConvs = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout fullWidth>
      <div className={styles.container}>
        {/* Left Sidebar: Conversations List */}
        <div className={`${styles.sidebar} ${activeConvId ? styles.sidebarHiddenMobile : ""}`}>
          <div className={styles.sidebarHeader}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageCircle size={24} style={{ color: "#00f2fe" }} /> Messages
            </h2>
            <button 
              onClick={() => setShowNewChatModal(true)}
              className={styles.actionBtn}
              title="Start New Chat"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <Search size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
              <input
                type="text"
                placeholder="Search DMs & contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: "none", border: "none", color: "#ffffff", outline: "none", width: "100%", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div className={styles.conversationsList}>
            {filteredConvs.map(conv => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ""}`}
                >
                  <div className={styles.avatarWrapper}>
                    <img
                      src={conv.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name)}`}
                      alt={conv.name}
                      style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    {conv.isOnline && <div className={styles.onlineBadge} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {conv.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                        {conv.lastTime}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {conv.lastMessage || "No messages yet"}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span style={{ background: "#00f2fe", color: "#000000", fontWeight: 900, fontSize: "0.72rem", padding: "2px 8px", borderRadius: "9999px" }}>
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

        {/* Right Area: Active Chat Window */}
        <div className={`${styles.chatWindow} ${!activeConvId ? styles.chatHiddenMobile : ""}`}>
          {activeConv ? (
            <>
              {/* Active Chat Top Header */}
              <div className={styles.chatHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button 
                    onClick={() => setActiveConvId(null)}
                    className={styles.actionBtn}
                    style={{ display: "flex" }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className={styles.avatarWrapper}>
                    <img
                      src={activeConv.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConv.name)}`}
                      alt={activeConv.name}
                      style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    {activeConv.isOnline && <div className={styles.onlineBadge} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", margin: 0 }}>
                      {activeConv.name}
                    </h3>
                    <span style={{ fontSize: "0.78rem", color: activeConv.isOnline ? "#10b981" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                      {activeConv.isOnline ? "Online • Active Now" : `@${activeConv.username}`}
                    </span>
                  </div>
                </div>

                {/* Instant Voice & Video Call Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => startCall(activeConv.partnerId || activeConv.username || activeConv.name, "voice", activeConv.name, activeConv.avatar)}
                    className={styles.actionBtn}
                    title="Start Voice Call"
                    style={{ background: "rgba(0, 242, 254, 0.15)", border: "1px solid rgba(0, 242, 254, 0.3)", color: "#00f2fe" }}
                  >
                    <Phone size={20} />
                  </button>
                  <button
                    onClick={() => startCall(activeConv.partnerId || activeConv.username || activeConv.name, "video", activeConv.name, activeConv.avatar)}
                    className={styles.actionBtn}
                    title="Start Video Call"
                    style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", color: "#a855f7" }}
                  >
                    <Video size={20} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Scrolling Body */}
              <div className={styles.messagesArea}>
                {messages.map(msg => (
                  <div key={msg.id} className={msg.isMe ? styles.sentMessage : styles.receivedMessage}>
                    <div className={msg.isMe ? styles.sentBubble : styles.receivedBubble}>
                      {msg.text}
                      {msg.imageUrl && (
                        <img 
                          src={msg.imageUrl} 
                          alt="Attached media" 
                          style={{ width: "100%", maxWidth: "260px", borderRadius: "14px", marginTop: "8px", objectFit: "cover" }} 
                        />
                      )}
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: "4px", padding: "0 6px", fontWeight: 600 }}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isPartnerTyping && (
                  <div className={styles.receivedMessage}>
                    <div className={styles.receivedBubble} style={{ display: "flex", alignItems: "center", gap: "6px", fontStyle: "italic" }}>
                      <Sparkles size={16} className="animate-spin" style={{ color: "#00f2fe" }} />
                      <span>Typing a message...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSendMessage} className={styles.inputForm}>
                <input
                  type="text"
                  placeholder={`Message ${activeConv.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={styles.messageInput}
                />
                <button type="submit" className={styles.sendBtn} title="Send Message">
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", gap: "16px" }}>
              <MessageCircle size={64} style={{ color: "rgba(0,242,254,0.3)" }} />
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>Select a Conversation</h3>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>Choose a friend from the left list to start messaging or HD calling!</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "white", textAlign: "center" }}>Loading DOST Messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
