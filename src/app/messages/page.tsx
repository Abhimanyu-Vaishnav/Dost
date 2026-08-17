"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, Image as ImageIcon, Smile, Mic, Phone, Video, 
  Search, Plus, MoreVertical, CheckCheck, Sparkles, MessageCircle, X, ArrowLeft,
  Square, Play, Pause, Trash2, User, Pin, BellOff, Bell, ShieldAlert, Check, Copy, Reply,
  Mail, MailCheck
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
  const router = useRouter();
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

  // 3-Dots Menu & In-Chat Search States
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [inChatSearch, setInChatSearch] = useState("");
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [mutedConvs, setMutedConvs] = useState<string[]>([]);
  const [pinnedConvs, setPinnedConvs] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Long-Press Gesture & Quick Reply States
  const [longPressMsg, setLongPressMsg] = useState<ChatMessage | null>(null);
  const [longPressConv, setLongPressConv] = useState<Conversation | null>(null);
  const [unreadConvs, setUnreadConvs] = useState<string[]>(["conv-1"]);
  const [replyingToMsg, setReplyingToMsg] = useState<ChatMessage | null>(null);
  const touchTimerRef = useRef<any>(null);

  const handleTouchStart = (msg: ChatMessage) => {
    touchTimerRef.current = setTimeout(() => {
      setLongPressMsg(msg);
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(40);
      }
    }, 450);
  };

  const handleTouchStartConv = (conv: Conversation) => {
    touchTimerRef.current = setTimeout(() => {
      setLongPressConv(conv);
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(40);
      }
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Clear unread count when opening chat (Auto Mark As Read)
  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    setUnreadConvs(prev => prev.filter(id => id !== convId));
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    }));
  };

  useEffect(() => {
    if (activeConvId) {
      setUnreadConvs(prev => prev.filter(id => id !== activeConvId));
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unreadCount: 0 } : c));
    }
  }, [activeConvId]);
  
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
            {[...filteredConversations]
              .sort((a, b) => (pinnedConvs.includes(b.id) ? 1 : 0) - (pinnedConvs.includes(a.id) ? 1 : 0))
              .map(conv => {
                const isActive = conv.id === activeConvId;
                const isPinned = pinnedConvs.includes(conv.id);
                const isMuted = mutedConvs.includes(conv.id);
                const isUnread = unreadConvs.includes(conv.id) || conv.unreadCount > 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    onTouchStart={() => handleTouchStartConv(conv)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                    onMouseDown={() => handleTouchStartConv(conv)}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setLongPressConv(conv);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px 20px",
                      cursor: "pointer",
                      backgroundColor: isActive ? "rgba(0, 242, 254, 0.08)" : "transparent",
                      borderLeft: isActive ? "4px solid #00f2fe" : "4px solid transparent",
                      transition: "background-color 0.15s ease"
                    }}
                    className="hover-bg"
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={conv.avatar}
                        alt={conv.name}
                        style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      {conv.isOnline && (
                        <span style={{
                          position: "absolute", bottom: "2px", right: "2px",
                          width: "14px", height: "14px", borderRadius: "50%",
                          backgroundColor: "#10b981", border: "2px solid var(--color-bg-surface)"
                        }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                          <span style={{ fontWeight: isUnread ? 900 : 700, fontSize: "1.1rem", color: "var(--color-text-main)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {conv.name}
                          </span>
                          {isPinned && <Pin size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />}
                          {isMuted && <BellOff size={14} style={{ color: "#a855f7", flexShrink: 0 }} />}
                        </div>
                        <span style={{ fontSize: "0.82rem", color: isUnread ? "#00f2fe" : "var(--color-text-muted)", fontWeight: isUnread ? 700 : 500, flexShrink: 0 }}>
                          {conv.lastTime}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                          fontSize: "0.95rem", color: isUnread ? "var(--color-text-main)" : "var(--color-text-muted)",
                          fontWeight: isUnread ? 700 : 400,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                        }}>
                          {conv.lastMessage}
                        </span>
                        {isUnread && (
                          <span style={{
                            background: "linear-gradient(135deg, #00f2fe, #7b2cbf)", color: "white",
                            fontSize: "0.78rem", fontWeight: 800, padding: "2px 8px",
                            borderRadius: "99px", flexShrink: 0
                          }}>
                            {conv.unreadCount > 0 ? conv.unreadCount : "NEW"}
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
                  <div style={{ position: "relative" }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTopMenu(!showTopMenu);
                      }}
                      style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "8px" }} 
                      className="hover-bg-circle"
                      title="More Options"
                    >
                      <MoreVertical size={22} />
                    </button>

                    {/* 3-Dots Advanced Options Dropdown Menu */}
                    {showTopMenu && (
                      <>
                        <div 
                          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                          onClick={() => setShowTopMenu(false)}
                        />
                        <div 
                          className="glass animate-scale-in"
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: "4px",
                            width: "220px",
                            maxWidth: "calc(100% - 8px)",
                            background: "var(--color-bg-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "18px",
                            padding: "6px",
                            boxShadow: "0 14px 40px rgba(0,0,0,0.5)",
                            zIndex: 100,
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px"
                          }}
                        >
                          {/* 1. View Profile */}
                          <button
                            onClick={() => {
                              setShowTopMenu(false);
                              router.push(`/profile/${activeConv.username || activeConv.id}`);
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "10px 14px", border: "none", background: "transparent",
                              color: "var(--color-text-main)", fontSize: "0.92rem", fontWeight: 600,
                              borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left"
                            }}
                            className="hover-bg"
                          >
                            <User size={18} style={{ color: "#00f2fe" }} />
                            <span>View Profile</span>
                          </button>

                          {/* 2. Search in Conversation */}
                          <button
                            onClick={() => {
                              setShowTopMenu(false);
                              setShowInChatSearch(!showInChatSearch);
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "10px 14px", border: "none", background: "transparent",
                              color: "var(--color-text-main)", fontSize: "0.92rem", fontWeight: 600,
                              borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left"
                            }}
                            className="hover-bg"
                          >
                            <Search size={18} style={{ color: "var(--color-primary)" }} />
                            <span>Search in Chat</span>
                          </button>

                          {/* 3. Pin / Unpin Conversation */}
                          <button
                            onClick={() => {
                              setShowTopMenu(false);
                              const isPinned = pinnedConvs.includes(activeConv.id);
                              if (isPinned) {
                                setPinnedConvs(pinnedConvs.filter(id => id !== activeConv.id));
                                showToast(`Unpinned conversation with ${activeConv.name}`);
                              } else {
                                setPinnedConvs([...pinnedConvs, activeConv.id]);
                                showToast(`Pinned conversation with ${activeConv.name}`);
                              }
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "10px 14px", border: "none", background: "transparent",
                              color: "var(--color-text-main)", fontSize: "0.92rem", fontWeight: 600,
                              borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left"
                            }}
                            className="hover-bg"
                          >
                            <Pin size={18} style={{ color: "#f59e0b" }} />
                            <span>{pinnedConvs.includes(activeConv.id) ? "Unpin Conversation" : "Pin to Top"}</span>
                          </button>

                          {/* 4. Mute / Unmute Notifications */}
                          <button
                            onClick={() => {
                              setShowTopMenu(false);
                              const isMuted = mutedConvs.includes(activeConv.id);
                              if (isMuted) {
                                setMutedConvs(mutedConvs.filter(id => id !== activeConv.id));
                                showToast(`Unmuted notifications for ${activeConv.name}`);
                              } else {
                                setMutedConvs([...mutedConvs, activeConv.id]);
                                showToast(`Muted notifications for ${activeConv.name}`);
                              }
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "10px 14px", border: "none", background: "transparent",
                              color: "var(--color-text-main)", fontSize: "0.92rem", fontWeight: 600,
                              borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left"
                            }}
                            className="hover-bg"
                          >
                            {mutedConvs.includes(activeConv.id) ? (
                              <Bell size={18} style={{ color: "#10b981" }} />
                            ) : (
                              <BellOff size={18} style={{ color: "#a855f7" }} />
                            )}
                            <span>{mutedConvs.includes(activeConv.id) ? "Unmute Notifications" : "Mute Notifications"}</span>
                          </button>

                          <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />

                          {/* 5. Clear Chat History */}
                          <button
                            onClick={() => {
                              setShowTopMenu(false);
                              if (confirm(`Are you sure you want to clear chat history with ${activeConv.name}?`)) {
                                setMessagesMap(prev => ({
                                  ...prev,
                                  [activeConv.id]: []
                                }));
                                showToast("Chat history cleared");
                              }
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "10px 14px", border: "none", background: "transparent",
                              color: "#ef4444", fontSize: "0.92rem", fontWeight: 600,
                              borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left"
                            }}
                            className="hover-bg"
                          >
                            <Trash2 size={18} />
                            <span>Clear History</span>
                          </button>

                          {/* 6. Block & Report */}
                          <button
                            onClick={() => {
                              setShowTopMenu(false);
                              showToast(`Blocked & reported ${activeConv.name}`);
                              setActiveConvId(null);
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "10px 14px", border: "none", background: "transparent",
                              color: "#ef4444", fontSize: "0.92rem", fontWeight: 600,
                              borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left"
                            }}
                            className="hover-bg"
                          >
                            <ShieldAlert size={18} />
                            <span>Block &amp; Report</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* In-Chat Search Bar Drawer (When triggered from 3-Dots menu) */}
              {showInChatSearch && (
                <div 
                  className="animate-slide-up"
                  style={{
                    padding: "8px 16px",
                    background: "var(--color-bg-surface)",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <Search size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                  <input
                    type="text"
                    autoFocus
                    placeholder={`Search messages in chat with ${activeConv.name}...`}
                    value={inChatSearch}
                    onChange={(e) => setInChatSearch(e.target.value)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "var(--color-text-main)",
                      fontSize: "0.92rem",
                      fontWeight: 600
                    }}
                  />
                  {inChatSearch && (
                    <button
                      onClick={() => setInChatSearch("")}
                      style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowInChatSearch(false);
                      setInChatSearch("");
                    }}
                    style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Chat Messages Feed */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                position: "relative"
              }}>
                {/* Floating Toast Notification Banner */}
                {toastMsg && (
                  <div 
                    className="glass animate-slide-up"
                    style={{
                      position: "sticky",
                      top: "10px",
                      alignSelf: "center",
                      background: "var(--color-bg-surface)",
                      border: "1px solid var(--aurora-cyan, var(--color-primary))",
                      borderRadius: "99px",
                      padding: "8px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "var(--color-text-main)",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      zIndex: 80
                    }}
                  >
                    <Check size={16} style={{ color: "#10b981" }} />
                    <span>{toastMsg}</span>
                  </div>
                )}

                {(inChatSearch.trim() 
                  ? activeMessages.filter(m => m.text.toLowerCase().includes(inChatSearch.toLowerCase()))
                  : activeMessages
                ).map(msg => (
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
                      onTouchStart={() => handleTouchStart(msg)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd}
                      onMouseDown={() => handleTouchStart(msg)}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setLongPressMsg(msg);
                      }}
                      style={{
                        maxWidth: "82%",
                        padding: "12px 18px",
                        borderRadius: msg.isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                        background: msg.isMe 
                          ? "linear-gradient(135deg, #00f2fe 0%, #3b82f6 50%, #7b2cbf 100%)" 
                          : "var(--color-bg-surface)",
                        color: msg.isMe ? "#ffffff" : "var(--color-text-main)",
                        border: longPressMsg?.id === msg.id 
                          ? "2px solid #00f2fe" 
                          : msg.isMe ? "none" : "1px solid var(--color-border)",
                        boxShadow: longPressMsg?.id === msg.id 
                          ? "0 0 24px rgba(0, 242, 254, 0.7)" 
                          : msg.isMe ? "0 4px 18px rgba(0, 242, 254, 0.25)" : "var(--shadow-sm)",
                        transform: longPressMsg?.id === msg.id ? "scale(1.03)" : "none",
                        zIndex: longPressMsg?.id === msg.id ? 9999 : "auto",
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
              {/* Long-Press Message Context Sheet Modal (Constrained 100% Inside Active Chat Container) */}
              {longPressMsg && (
                <>
                  <div 
                    style={{
                      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                      background: "rgba(0,0,0,0.35)",
                      zIndex: 900
                    }}
                    onClick={() => setLongPressMsg(null)}
                  />
                  <div 
                    className="glass animate-spring-pop"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "16px",
                      right: "16px",
                      transform: "translateY(-50%)",
                      maxWidth: "280px",
                      margin: "0 auto",
                      background: "var(--color-bg-surface)",
                      border: "1px solid #00f2fe",
                      borderRadius: "24px",
                      padding: "16px",
                      boxShadow: "0 20px 60px rgba(0,242,254,0.25), 0 10px 40px rgba(0,0,0,0.6)",
                      zIndex: 999,
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    {/* Quick Emoji Reaction Row */}
                    <div style={{ display: "flex", justifyContent: "space-around", paddingBottom: "8px", borderBottom: "1px solid var(--color-border)" }}>
                      {EMOJI_REACTIONS_PRESETS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            handleAddReaction(longPressMsg.id, emoji);
                            setLongPressMsg(null);
                          }}
                          style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
                          className="hover:scale-125 active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Target Message Preview */}
                    <div style={{ padding: "6px 10px", background: "var(--color-bg-base)", borderRadius: "10px", fontSize: "0.85rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      "{longPressMsg.text}"
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <button
                        onClick={() => {
                          setReplyingToMsg(longPressMsg);
                          setInputText(`Replying to "${longPressMsg.text.slice(0, 25)}...": `);
                          setLongPressMsg(null);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", border: "none", background: "transparent", color: "var(--color-text-main)", fontSize: "0.92rem", fontWeight: 700, borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left" }}
                        className="hover-bg"
                      >
                        <Reply size={17} style={{ color: "#00f2fe" }} />
                        <span>Reply to Message</span>
                      </button>

                      <button
                        onClick={() => {
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(longPressMsg.text);
                            showToast("Message copied to clipboard!");
                          }
                          setLongPressMsg(null);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", border: "none", background: "transparent", color: "var(--color-text-main)", fontSize: "0.92rem", fontWeight: 700, borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left" }}
                        className="hover-bg"
                      >
                        <Copy size={17} style={{ color: "var(--color-primary)" }} />
                        <span>Copy Text</span>
                      </button>

                      <button
                        onClick={() => {
                          if (activeConvId) {
                            setMessagesMap(prev => ({
                              ...prev,
                              [activeConvId]: (prev[activeConvId] || []).filter(m => m.id !== longPressMsg.id)
                            }));
                            showToast("Message deleted");
                          }
                          setLongPressMsg(null);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", border: "none", background: "transparent", color: "#ef4444", fontSize: "0.92rem", fontWeight: 700, borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left" }}
                        className="hover-bg"
                      >
                        <Trash2 size={17} />
                        <span>Delete Message</span>
                      </button>

                      <button
                        onClick={() => setLongPressMsg(null)}
                        style={{ padding: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-muted)", fontSize: "0.88rem", fontWeight: 700, borderRadius: "12px", cursor: "pointer", marginTop: "4px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
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

      {/* Long-Press Conversation Action Sheet Modal (Mark as Read / Unread, Pin, Mute) */}
      {longPressConv && (
        <>
          <div 
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 9998
            }}
            onClick={() => setLongPressConv(null)}
          />
          <div 
            className="glass animate-spring-pop"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - 32px)",
              maxWidth: "320px",
              background: "var(--color-bg-surface)",
              border: "1px solid #00f2fe",
              borderRadius: "24px",
              padding: "18px",
              boxShadow: "0 20px 60px rgba(0,242,254,0.25), 0 10px 40px rgba(0,0,0,0.6)",
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            {/* Contact Header Preview */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
              <img src={longPressConv.avatar} alt={longPressConv.name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--color-text-main)" }}>{longPressConv.name}</span>
                <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>@{longPressConv.username}</span>
              </div>
            </div>

            {/* Conversation Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* Mark as Read / Unread */}
              <button
                onClick={() => {
                  const isUnread = unreadConvs.includes(longPressConv.id) || longPressConv.unreadCount > 0;
                  if (isUnread) {
                    setUnreadConvs(unreadConvs.filter(id => id !== longPressConv.id));
                    setConversations(prev => prev.map(c => c.id === longPressConv.id ? { ...c, unreadCount: 0 } : c));
                    showToast(`Marked chat with ${longPressConv.name} as Read`);
                  } else {
                    setUnreadConvs([...unreadConvs, longPressConv.id]);
                    setConversations(prev => prev.map(c => c.id === longPressConv.id ? { ...c, unreadCount: 1 } : c));
                    showToast(`Marked chat with ${longPressConv.name} as Unread`);
                  }
                  setLongPressConv(null);
                }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "none", background: "transparent", color: "var(--color-text-main)", fontSize: "0.95rem", fontWeight: 700, borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left" }}
                className="hover-bg"
              >
                {(unreadConvs.includes(longPressConv.id) || longPressConv.unreadCount > 0) ? (
                  <>
                    <MailCheck size={18} style={{ color: "#10b981" }} />
                    <span>Mark as Read</span>
                  </>
                ) : (
                  <>
                    <Mail size={18} style={{ color: "#00f2fe" }} />
                    <span>Mark as Unread</span>
                  </>
                )}
              </button>

              {/* Pin / Unpin */}
              <button
                onClick={() => {
                  const isPinned = pinnedConvs.includes(longPressConv.id);
                  if (isPinned) {
                    setPinnedConvs(pinnedConvs.filter(id => id !== longPressConv.id));
                    showToast(`Unpinned ${longPressConv.name}`);
                  } else {
                    setPinnedConvs([...pinnedConvs, longPressConv.id]);
                    showToast(`Pinned ${longPressConv.name} to top`);
                  }
                  setLongPressConv(null);
                }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "none", background: "transparent", color: "var(--color-text-main)", fontSize: "0.95rem", fontWeight: 700, borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left" }}
                className="hover-bg"
              >
                <Pin size={18} style={{ color: "#f59e0b" }} />
                <span>{pinnedConvs.includes(longPressConv.id) ? "Unpin Conversation" : "Pin to Top"}</span>
              </button>

              {/* Mute / Unmute */}
              <button
                onClick={() => {
                  const isMuted = mutedConvs.includes(longPressConv.id);
                  if (isMuted) {
                    setMutedConvs(mutedConvs.filter(id => id !== longPressConv.id));
                    showToast(`Unmuted ${longPressConv.name}`);
                  } else {
                    setMutedConvs([...mutedConvs, longPressConv.id]);
                    showToast(`Muted ${longPressConv.name}`);
                  }
                  setLongPressConv(null);
                }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "none", background: "transparent", color: "var(--color-text-main)", fontSize: "0.95rem", fontWeight: 700, borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left" }}
                className="hover-bg"
              >
                {mutedConvs.includes(longPressConv.id) ? (
                  <Bell size={18} style={{ color: "#10b981" }} />
                ) : (
                  <BellOff size={18} style={{ color: "#a855f7" }} />
                )}
                <span>{mutedConvs.includes(longPressConv.id) ? "Unmute Notifications" : "Mute Notifications"}</span>
              </button>

              <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />

              {/* Delete Conversation */}
              <button
                onClick={() => {
                  if (confirm(`Delete conversation with ${longPressConv.name}?`)) {
                    setConversations(conversations.filter(c => c.id !== longPressConv.id));
                    if (activeConvId === longPressConv.id) setActiveConvId(null);
                    showToast("Conversation deleted");
                  }
                  setLongPressConv(null);
                }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "none", background: "transparent", color: "#ef4444", fontSize: "0.95rem", fontWeight: 700, borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left" }}
                className="hover-bg"
              >
                <Trash2 size={18} />
                <span>Delete Conversation</span>
              </button>

              <button
                onClick={() => setLongPressConv(null)}
                style={{ padding: "10px", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-muted)", fontSize: "0.92rem", fontWeight: 700, borderRadius: "12px", cursor: "pointer", marginTop: "4px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

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
