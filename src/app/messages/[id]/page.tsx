"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Send, MoreVertical, Search, Info, Trash2, X, Paperclip, Smile, 
  Image as ImageIcon, Video, MapPin, Sticker, ArrowLeft,
  VolumeX, Ban, Circle, Square, CheckSquare, Trash, Phone
} from "lucide-react";
import { use } from "react";
import { formatDistanceToNow } from "date-fns";
import { useCall } from "@/context/CallContext";

const EMOJIS = ["😂", "❤️", "😍", "🔥", "😭", "😊", "✨", "🙏", "👍", "🥰", "🎉", "💯", "😎", "🥺", "🤔"];

export default function ActiveChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { startCall } = useCall();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id: conversationId } = use(params);

  const handleMuteUser = async () => {
    if (!otherUser) return;
    try {
      const res = await fetch(`/api/users/${otherUser.id}/mute`, { method: "POST" });
      if (res.ok) {
        alert(`${otherUser.name} has been muted successfully!`);
        setShowOptions(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleBlockUser = async () => {
    if (!otherUser) return;
    try {
      const res = await fetch(`/api/users/${otherUser.id}/block`, { method: "POST" });
      if (res.ok) {
        alert(`${otherUser.name} has been blocked successfully!`);
        setShowOptions(false);
        router.push("/messages");
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteConversation = async () => {
    if (!confirm("Are you sure you want to delete this entire conversation?")) return;
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/messages");
      }
    } catch (e) { console.error(e); }
  };

  const toggleSelectMessage = (msgId: string) => {
    if (selectedMessageIds.includes(msgId)) {
      const updated = selectedMessageIds.filter(id => id !== msgId);
      setSelectedMessageIds(updated);
      if (updated.length === 0) setSelectionMode(false);
    } else {
      setSelectedMessageIds([...selectedMessageIds, msgId]);
    }
  };

  const handleTouchStart = (msgId: string) => {
    isLongPress.current = false;
    longPressTimeout.current = setTimeout(() => {
      isLongPress.current = true;
      setSelectionMode(true);
      setSelectedMessageIds([msgId]);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedMessageIds.length) return;
    if (!confirm(`Delete ${selectedMessageIds.length} message(s)?`)) return;
    try {
      const res = await fetch("/api/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds: selectedMessageIds })
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => !selectedMessageIds.includes(m.id)));
        setSelectedMessageIds([]);
        setSelectionMode(false);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetch("/api/users/profile")
      .then(res => res.json())
      .then(data => {
        if (data.user) setCurrentUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?convId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.otherUser) setOtherUser(data.otherUser);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const tempMsg = {
      id: `temp_${Date.now()}`,
      content: inputValue,
      senderId: currentUserId,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);
    const textToSend = inputValue;
    setInputValue("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: textToSend
        })
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (e) { console.error(e); }
  };

  const handleVoiceCallClick = () => {
    if (!otherUser) return;
    startCall(otherUser.id || otherUser.username, "voice", otherUser.name, otherUser.avatar);
  };

  const handleVideoCallClick = () => {
    if (!otherUser) return;
    startCall(otherUser.id || otherUser.username, "video", otherUser.name, otherUser.avatar);
  };

  const filteredMessages = messages.filter(m => 
    !searchQuery ? true : m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--color-bg-base)", color: "var(--color-text-main)", overflow: "hidden" }}>
      {/* Top Bar Header */}
      <div className="glass" style={{ 
        display: "flex", alignItems: "center", justifyContent: "space-between", 
        padding: "12px 16px", borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg-surface)", zIndex: 50, position: "relative"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/messages" style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", textDecoration: "none" }}>
            <ArrowLeft size={24} />
          </Link>

          <img 
            src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || "User")}`} 
            alt={otherUser?.name || "User"} 
            style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-primary)" }}
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)" }}>
              {otherUser?.name || "User"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 500 }}>
              {(() => {
                if (!otherUser?.lastSeen) return "Active recently";
                const lastSeenDate = new Date(otherUser.lastSeen);
                const diffMs = Date.now() - lastSeenDate.getTime();
                if (diffMs < 120000) return "Active Now";
                return `Active ${formatDistanceToNow(lastSeenDate, { addSuffix: true })}`;
              })()}
            </p>
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Real-time WebRTC Voice Call Trigger */}
          <button onClick={handleVoiceCallClick} style={{
            background: "transparent", border: "none", color: "var(--color-primary)", cursor: "pointer",
            width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
          }} className="hover-bg" title="Start HD Voice Call">
            <Phone size={22} />
          </button>
          
          {/* Real-time WebRTC Video Call Trigger */}
          <button onClick={handleVideoCallClick} style={{
            background: "transparent", border: "none", color: "var(--color-primary)", cursor: "pointer",
            width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
          }} className="hover-bg" title="Start HD Video Call">
            <Video size={22} />
          </button>

          <button onClick={() => setShowOptions(!showOptions)} style={{
            background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer",
            width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s"
          }} className="hover-bg">
            <MoreVertical size={24} />
          </button>

          {showOptions && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setShowOptions(false)} />
              <div className="glass animate-scale-in responsive-dropdown-menu" style={{
                position: "absolute", right: 0, top: "50px", zIndex: 100,
                minWidth: "220px", background: "var(--color-bg-surface)", borderRadius: "16px",
                border: "1px solid var(--color-border)", boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                padding: "8px", display: "flex", flexDirection: "column", gap: "4px"
              }}>
                <button onClick={() => { setShowSearch(!showSearch); setShowOptions(false); }} className="hover-bg" style={{
                  display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none",
                  padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "var(--color-text-main)", fontWeight: 600, fontSize: "1rem"
                }}>
                  <Search size={18} /> Search in Chat
                </button>
                <button onClick={() => { if (otherUser) router.push(`/profile/${otherUser.id}`); setShowOptions(false); }} className="hover-bg" style={{
                  display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none",
                  padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "var(--color-text-main)", fontWeight: 600, fontSize: "1rem"
                }}>
                  <Info size={18} /> View Profile
                </button>
                <button onClick={handleMuteUser} className="hover-bg" style={{
                  display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none",
                  padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "var(--color-text-main)", fontWeight: 600, fontSize: "1rem"
                }}>
                  <VolumeX size={18} /> Mute Notifications
                </button>
                <button onClick={handleBlockUser} className="hover-bg" style={{
                  display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none",
                  padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "#e11d48", fontWeight: 600, fontSize: "1rem"
                }}>
                  <Ban size={18} /> Block User
                </button>
                <button onClick={handleDeleteConversation} className="hover-bg" style={{
                  display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none",
                  padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "1rem"
                }}>
                  <Trash2 size={18} /> Delete Conversation
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Bar in Chat Header */}
      {showSearch && (
        <div style={{ padding: "8px 16px", background: "var(--color-bg-surface)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Search size={18} color="var(--color-text-muted)" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", color: "var(--color-text-main)", outline: "none", fontSize: "0.95rem" }}
            autoFocus
          />
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Message Selection Header Bar */}
      {selectionMode && (
        <div className="glass animate-fade-in" style={{
          padding: "10px 16px", background: "var(--color-primary-light)", borderBottom: "1px solid var(--color-primary)",
          display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 40
        }}>
          <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>
            {selectedMessageIds.length} Selected
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={handleDeleteSelected} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              <Trash size={16} /> Delete
            </button>
            <button onClick={() => { setSelectionMode(false); setSelectedMessageIds([]); }} style={{ background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", fontWeight: 600 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredMessages.map((msg, index) => {
          const isMe = msg.senderId === currentUserId;
          const isSelected = selectedMessageIds.includes(msg.id);

          return (
            <div 
              key={msg.id || index}
              onTouchStart={() => handleTouchStart(msg.id)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart(msg.id)}
              onMouseUp={handleTouchEnd}
              onClick={() => {
                if (selectionMode) toggleSelectMessage(msg.id);
              }}
              style={{
                display: "flex",
                justifyContent: isMe ? "flex-end" : "flex-start",
                alignItems: "center",
                gap: "8px",
                cursor: selectionMode ? "pointer" : "default"
              }}
            >
              {selectionMode && (
                <div style={{ color: isSelected ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                  {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
              )}

              <div style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                background: isSelected 
                  ? "var(--color-primary-light)" 
                  : isMe ? "var(--color-primary)" : "var(--color-bg-surface)",
                color: isMe ? "#ffffff" : "var(--color-text-main)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                position: "relative",
                border: isMe ? "none" : "1px solid var(--color-border)",
                wordBreak: "break-word"
              }}>
                <p style={{ margin: 0, fontSize: "1rem", lineHeight: "1.4" }}>
                  {msg.content}
                </p>

                <span style={{ 
                  fontSize: "0.7rem", 
                  opacity: 0.75, 
                  display: "block", 
                  textAlign: "right",
                  marginTop: "4px" 
                }}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Box */}
      {showEmojis && (
        <div className="glass animate-slide-up" style={{
          padding: "12px", background: "var(--color-bg-surface)", borderTop: "1px solid var(--color-border)",
          display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center"
        }}>
          {EMOJIS.map((emoji, idx) => (
            <button key={idx} onClick={() => setInputValue(prev => prev + emoji)} style={{
              background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", padding: "4px"
            }}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Message Input Form Bar */}
      <div className="glass" style={{ 
        padding: "12px 16px", borderTop: "1px solid var(--color-border)", 
        background: "var(--color-bg-surface)", zIndex: 40 
      }}>
        <form onSubmit={handleSendMessage} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button type="button" onClick={() => setShowEmojis(!showEmojis)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
            <Smile size={22} />
          </button>

          <input 
            type="text" 
            placeholder="Type a message..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ 
              flex: 1, 
              padding: "12px 18px", 
              borderRadius: "24px", 
              border: "1px solid var(--color-border)", 
              background: "var(--color-bg-base)", 
              color: "var(--color-text-main)", 
              fontSize: "1rem", 
              outline: "none" 
            }}
          />

          <button type="submit" disabled={!inputValue.trim()} style={{ 
            width: "44px", height: "44px", borderRadius: "50%", 
            background: inputValue.trim() ? "var(--color-primary)" : "var(--color-bg-surface)", 
            color: inputValue.trim() ? "#ffffff" : "var(--color-text-muted)", 
            border: "none", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            cursor: inputValue.trim() ? "pointer" : "default",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: inputValue.trim() ? "scale(1)" : "scale(0.95)",
            boxShadow: inputValue.trim() ? "0 4px 12px rgba(29, 155, 240, 0.3)" : "none"
          }}>
            <Send size={20} style={{ transform: inputValue.trim() ? "translateX(2px)" : "none", transition: "transform 0.2s" }} />
          </button>
        </form>
      </div>
    </div>
  );
}
