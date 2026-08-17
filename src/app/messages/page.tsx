"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Send, Image as ImageIcon, Smile, Mic, Phone, Video, 
  Search, Plus, MoreVertical, CheckCheck, Sparkles, MessageCircle, X, ArrowLeft,
  Square, Play, Pause, Trash2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import styles from "./messages.module.css";
import { CallModal } from "./CallModal";
import { uploadMediaFile } from "@/lib/upload";

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

const EMOJI_REACTIONS_PRESETS = ["❤️", "🔥", "😂", "👏", "💯", "😮", "👍"];

const FULL_EMOJI_GRID = [
  "❤️", "🔥", "😂", "👏", "💯", "😮", "👍", "🙏", "✨", "🎉", "🚀", "👀",
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "🥲", "☺️", "😊", "😇", "🙂",
  "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😛", "😜", "🤪", "😎",
  "🥳", "😏", "😒", "😞", "😔", "😟", "🥺", "😢", "😭", "😤", "😠", "🤯",
  "💖", "💗", "💓", "💞", "💕", "❣️", "🔴", "🧡", "💛", "💚", "💙", "💜",
  "✋", "🖐️", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉"
];

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
  
  // Chat Input & Popover States
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [emojiFilter, setEmojiFilter] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: "voice" | "video"; contact: any } | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [fullEmojiPickerMsgId, setFullEmojiPickerMsgId] = useState<string | null>(null);
  
  // Media & Voice Attachment States
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordTime, setVoiceRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load persistent messages & reactions from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dost_chat_messages_map");
      if (saved) {
        try {
          setMessagesMap(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  // Live Message Polling Stream every 2.5 seconds
  useEffect(() => {
    if (!activeConvId) return;
    const validId: string = activeConvId;

    async function syncLiveMessages() {
      try {
        const res = await fetch(`/api/messages?convId=${validId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessagesMap(prev => {
              const currentMsgs: ChatMessage[] = prev[validId] || [];
              const existingIds = new Set(currentMsgs.map((m: ChatMessage) => m.id));
              const brandNew = data.messages.filter((m: any) => !existingIds.has(m.id));
              if (brandNew.length > 0) {
                const updated = {
                  ...prev,
                  [validId]: [...currentMsgs, ...brandNew]
                };
                if (typeof window !== "undefined") {
                  localStorage.setItem("dost_chat_messages_map", JSON.stringify(updated));
                }
                return updated;
              }
              return prev;
            });
          }
        }
      } catch (e) {}
    }

    const liveInterval = setInterval(syncLiveMessages, 2500);
    return () => clearInterval(liveInterval);
  }, [activeConvId]);

  // Auto-select first conversation on Desktop (>650px)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 650 && !activeConvId) {
      handleSelectConversation("conv-1");
    }
  }, []);

  // Clear unread count when opening chat
  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    }));
  };

  useEffect(() => {
    if (activeConvId) {
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unreadCount: 0 } : c));
    }
  }, [activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];
  const activeMessages = activeConvId ? (messagesMap[activeConvId] || []) : [];

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeConvId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, activeConvId]);

  // Handle Image Attachment Selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadMediaFile(file);
      setAttachedImage(url);
    } catch (err) {
      console.error("Image upload error:", err);
      setAttachedImage(URL.createObjectURL(file));
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Voice Note Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        sendVoiceMessage(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecordingVoice(true);
      setVoiceRecordTime(0);

      recordTimerRef.current = setInterval(() => {
        setVoiceRecordTime(prev => {
          if (prev >= 30) {
            stopVoiceRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic error:", err);
      sendVoiceMessage("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  };

  const sendVoiceMessage = (audioUrl: string) => {
    if (!activeConvId) return;
    const currentId = activeConvId;
    const voiceMsg: ChatMessage = {
      id: `msg-voice-${Date.now()}`,
      senderId: "me",
      senderName: "You",
      text: "🎙️ Voice Note (00:15)",
      audioUrl: audioUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true
    };

    setMessagesMap(prev => {
      const updated = {
        ...prev,
        [currentId]: [...(prev[currentId] || []), voiceMsg]
      };
      if (typeof window !== "undefined") localStorage.setItem("dost_chat_messages_map", JSON.stringify(updated));
      return updated;
    });

    setConversations(prev => prev.map(c => {
      if (c.id === currentId) {
        return { ...c, lastMessage: "🎙️ Voice Note", lastTime: "Just now", unreadCount: 0 };
      }
      return c;
    }));
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || !activeConvId) return;

    const currentId = activeConvId;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "me",
      senderName: "You",
      text: inputText.trim() || (attachedImage ? "📷 Image Attached" : ""),
      imageUrl: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true
    };

    setMessagesMap(prev => {
      const updated = {
        ...prev,
        [currentId]: [...(prev[currentId] || []), newMsg]
      };
      if (typeof window !== "undefined") localStorage.setItem("dost_chat_messages_map", JSON.stringify(updated));
      return updated;
    });

    setConversations(prev => prev.map(c => {
      if (c.id === currentId) {
        return { ...c, lastMessage: inputText.trim() || "📷 Image", lastTime: "Just now", unreadCount: 0 };
      }
      return c;
    }));

    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ convId: currentId, text: newMsg.text, imageUrl: newMsg.imageUrl })
    }).catch(() => {});

    setInputText("");
    setAttachedImage(null);

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
        setMessagesMap(prev => {
          const updated = {
            ...prev,
            [currentId]: [...(prev[currentId] || []), replyMsg]
          };
          if (typeof window !== "undefined") localStorage.setItem("dost_chat_messages_map", JSON.stringify(updated));
          return updated;
        });
      }, 1400);
    }, 800);
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    if (!activeConvId) return;
    setMessagesMap(prev => {
      const updated = {
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
      };
      if (typeof window !== "undefined") localStorage.setItem("dost_chat_messages_map", JSON.stringify(updated));
      return updated;
    });
  };

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout fullWidth>
      {/* Hidden File Input for Image Attachments */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageSelect} 
        accept="image/*" 
        style={{ display: "none" }} 
      />

      <div className={styles.container} onClick={() => { setActiveReactionMsgId(null); setFullEmojiPickerMsgId(null); }}>
        {/* Left Sidebar Conversation List */}
        <div className={`${styles.sidebar} ${activeConvId ? styles.sidebarHiddenMobile : ""}`}>
          {/* Header */}
          <div style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--color-text-main)", margin: 0 }}>
              Messages
            </h2>
            <button style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "rgba(29, 155, 240, 0.12)", color: "var(--color-primary)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Plus size={22} />
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ padding: "14px 18px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "var(--color-bg-base)", padding: "14px 18px",
              borderRadius: "9999px", border: "1px solid var(--color-border)"
            }}>
              <Search size={20} style={{ color: "var(--color-text-muted)" }} />
              <input
                type="text"
                placeholder="Search Direct Messages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: "none", border: "none", color: "var(--color-text-main)",
                  outline: "none", fontSize: "1.05rem", width: "100%"
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
                  onClick={() => handleSelectConversation(conv.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "18px 22px",
                    cursor: "pointer",
                    backgroundColor: isActive ? "rgba(29, 155, 240, 0.08)" : "transparent",
                    borderLeft: isActive ? "4px solid var(--color-primary)" : "4px solid transparent",
                    transition: "background-color 0.15s ease"
                  }}
                  className="hover-bg"
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      style={{ width: "58px", height: "58px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    {conv.isOnline && (
                      <span style={{
                        position: "absolute", bottom: "2px", right: "2px",
                        width: "15px", height: "15px", borderRadius: "50%",
                        backgroundColor: "#10b981", border: "3px solid var(--color-bg-surface)"
                      }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--color-text-main)" }}>
                        {conv.name}
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        {conv.lastTime}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: "1.02rem", color: "var(--color-text-muted)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {conv.lastMessage}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span style={{
                          background: "var(--color-primary)", color: "white",
                          fontSize: "0.8rem", fontWeight: 800, padding: "3px 9px",
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
                padding: "16px 22px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--color-bg-surface)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  {/* Back Arrow for Mobile Screen */}
                  <button 
                    onClick={() => setActiveConvId(null)}
                    className={styles.backBtn}
                    title="Back to conversations"
                  >
                    <ArrowLeft size={24} />
                  </button>

                  <img
                    src={activeConv.avatar}
                    alt={activeConv.name}
                    style={{ width: "54px", height: "54px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--color-text-main)", margin: 0 }}>
                      {activeConv.name}
                    </h3>
                    <span style={{ fontSize: "0.95rem", color: activeConv.isOnline ? "#10b981" : "var(--color-text-muted)", fontWeight: 600 }}>
                      {activeConv.isOnline ? "Active now" : "Offline"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button 
                    onClick={() => setActiveCall({ type: "voice", contact: activeConv })}
                    style={{ background: "rgba(29, 155, 240, 0.12)", border: "none", color: "var(--color-primary)", cursor: "pointer", padding: "12px", borderRadius: "50%" }} 
                    className="hover:scale-105 active:scale-95"
                    title="Start Voice Call"
                  >
                    <Phone size={22} />
                  </button>
                  <button 
                    onClick={() => setActiveCall({ type: "video", contact: activeConv })}
                    style={{ background: "rgba(168, 85, 247, 0.12)", border: "none", color: "#a855f7", cursor: "pointer", padding: "12px", borderRadius: "50%" }} 
                    className="hover:scale-105 active:scale-95"
                    title="Start Video Call"
                  >
                    <Video size={22} />
                  </button>
                  <button style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "8px" }} className="hover-bg-circle">
                    <MoreVertical size={22} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                {activeMessages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: msg.isMe ? "flex-end" : "flex-start",
                      gap: "6px",
                      position: "relative"
                    }}
                  >
                    {/* Floating Reaction Popover Pill when message is clicked */}
                    {activeReactionMsgId === msg.id && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "-50px",
                          right: msg.isMe ? "0" : "auto",
                          left: msg.isMe ? "auto" : "0",
                          background: "var(--color-bg-surface)",
                          border: "1px solid var(--color-primary, #1d9bf0)",
                          borderRadius: "9999px",
                          padding: "6px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
                          zIndex: 20
                        }}
                        className="animate-scale-in"
                      >
                        {EMOJI_REACTIONS_PRESETS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddReaction(msg.id, emoji);
                              setActiveReactionMsgId(null);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: "1.45rem",
                              cursor: "pointer",
                              transition: "transform 0.15s ease",
                              padding: "2px"
                            }}
                            className="hover:scale-125 active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}

                        {/* More Emoji Grid Trigger Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullEmojiPickerMsgId(msg.id);
                            setActiveReactionMsgId(null);
                          }}
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "rgba(29, 155, 240, 0.2)",
                            color: "var(--color-primary, #1d9bf0)",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                          className="hover:scale-110"
                          title="More Emojis"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    )}

                    {/* Full Categorized Emoji Picker Box Drawer */}
                    {fullEmojiPickerMsgId === msg.id && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "-260px",
                          right: msg.isMe ? "0" : "auto",
                          left: msg.isMe ? "auto" : "0",
                          width: "300px",
                          height: "240px",
                          background: "var(--color-bg-surface)",
                          border: "1px solid var(--color-primary, #1d9bf0)",
                          borderRadius: "20px",
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7)",
                          zIndex: 30
                        }}
                        className="animate-scale-in"
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-main)" }}>React with Emoji</span>
                          <button 
                            onClick={() => setFullEmojiPickerMsgId(null)}
                            style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {/* Emoji Grid */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(6, 1fr)",
                          gap: "8px",
                          overflowY: "auto",
                          flex: 1,
                          paddingRight: "4px"
                        }}>
                          {FULL_EMOJI_GRID.map((emoji, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddReaction(msg.id, emoji);
                                setFullEmojiPickerMsgId(null);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "1.4rem",
                                cursor: "pointer",
                                padding: "4px",
                                borderRadius: "8px",
                                transition: "transform 0.15s ease"
                              }}
                              className="hover:scale-125 hover:bg-white/10 active:scale-95"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scaled Aurora Chat Bubble Component */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleAddReaction(msg.id, "❤️");
                      }}
                      style={{
                        maxWidth: "82%",
                        padding: "12px 18px",
                        borderRadius: msg.isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                        background: msg.isMe 
                          ? "linear-gradient(135deg, #00f2fe 0%, #3b82f6 50%, #7b2cbf 100%)" 
                          : "var(--color-bg-surface)",
                        color: msg.isMe ? "#ffffff" : "var(--color-text-main)",
                        border: msg.isMe ? "none" : "1px solid var(--color-border)",
                        boxShadow: msg.isMe 
                          ? "0 4px 18px rgba(0, 242, 254, 0.25)" 
                          : "var(--shadow-sm)",
                        fontSize: "1rem",
                        lineHeight: "1.5",
                        fontWeight: msg.isMe ? 600 : 500,
                        position: "relative",
                        cursor: "pointer",
                        userSelect: "none"
                      }}
                      className="hover:opacity-95 transition-all"
                    >
                      {/* Attached Image inside Bubble */}
                      {msg.imageUrl && (
                        <div style={{ marginBottom: "8px", borderRadius: "14px", overflow: "hidden" }}>
                          <img src={msg.imageUrl} alt="Attachment" style={{ maxWidth: "100%", maxHeight: "280px", display: "block", objectFit: "cover" }} />
                        </div>
                      )}

                      {/* Text */}
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
                          padding: "2px 8px",
                          fontSize: "0.85rem",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                        }}>
                          {msg.reactions.join(" ")}
                        </div>
                      )}
                    </div>

                    {/* Message Timestamp */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      <span>{msg.timestamp}</span>
                      {msg.isMe && <CheckCheck size={15} style={{ color: "#00f2fe" }} />}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "0.98rem" }}>
                    <span style={{ fontWeight: 600 }}>{activeConv.name} is typing...</span>
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>•</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attached Media Preview Box */}
              {attachedImage && (
                <div style={{ padding: "12px 22px", background: "var(--color-bg-surface)", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ position: "relative" }}>
                    <img src={attachedImage} alt="Attachment Preview" style={{ width: "64px", height: "64px", borderRadius: "14px", objectFit: "cover" }} />
                    <button 
                      type="button" 
                      onClick={() => setAttachedImage(null)}
                      style={{ position: "absolute", top: "-8px", right: "-8px", background: "#ef4444", color: "white", borderRadius: "50%", border: "none", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <span style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Photo attached</span>
                </div>
              )}

              {/* Sleek Bottom Chat Input Form */}
              <form
                onSubmit={handleSendMessage}
                className={styles.inputForm}
              >
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(0, 242, 254, 0.12)", border: "none", color: "var(--aurora-cyan)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} 
                  className="hover:scale-105"
                  title="Attach Photo"
                >
                  <ImageIcon size={20} />
                </button>

                <button 
                  type="button" 
                  onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                  style={{ width: "42px", height: "42px", borderRadius: "50%", background: isRecordingVoice ? "rgba(239, 68, 68, 0.15)" : "rgba(123, 44, 191, 0.15)", border: "none", color: isRecordingVoice ? "#ef4444" : "#a855f7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} 
                  className="hover:scale-105"
                  title={isRecordingVoice ? "Stop Recording" : "Record Voice Note"}
                >
                  {isRecordingVoice ? <Square size={18} className="animate-pulse" /> : <Mic size={20} />}
                </button>

                {isRecordingVoice ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.12)", padding: "10px 16px", borderRadius: "9999px", color: "#ef4444", fontSize: "0.92rem", fontWeight: 700 }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} className="animate-ping" />
                    <span>Recording Voice Note: 00:{voiceRecordTime < 10 ? `0${voiceRecordTime}` : voiceRecordTime}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={`Message ${activeConv.name}...`}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "11px 18px",
                      borderRadius: "9999px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-base)",
                      color: "var(--color-text-main)",
                      fontSize: "0.98rem",
                      outline: "none",
                      minWidth: 0
                    }}
                  />
                )}

                <button
                  type="submit"
                  disabled={!inputText.trim() && !attachedImage}
                  style={{
                    width: "42px", height: "42px", borderRadius: "50%",
                    background: (inputText.trim() || attachedImage) ? "linear-gradient(135deg, #00f2fe, #7b2cbf)" : "var(--color-border)",
                    color: "white", border: "none", cursor: (inputText.trim() || attachedImage) ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                    boxShadow: (inputText.trim() || attachedImage) ? "0 4px 14px rgba(0, 242, 254, 0.4)" : "none",
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
              <MessageCircle size={58} style={{ color: "var(--color-primary)", marginBottom: "16px" }} />
              <h3 style={{ fontSize: "1.45rem", fontWeight: 900, color: "var(--color-text-main)", marginBottom: "8px" }}>
                Select a conversation
              </h3>
              <p style={{ fontSize: "1.05rem", maxWidth: "360px" }}>
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
