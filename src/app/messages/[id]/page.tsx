"use client";

import { useEffect, useState, useRef } from "react";
import { Send, MoreVertical, Search, Info, Trash2, X, Paperclip, Smile, Image as ImageIcon, Video, MapPin, Sticker } from "lucide-react";
import { use } from "react";

const EMOJIS = ["😂", "❤️", "😍", "🔥", "😭", "😊", "✨", "🙏", "👍", "🥰", "🎉", "💯", "😎", "🥺", "🤔"];

export default function ActiveChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id: conversationId } = use(params);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        
        if (data.conversation && currentUserId) {
          const other = data.conversation.participants.find((p: any) => p.id !== currentUserId);
          if (other) setOtherUser(other);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetch("/api/users/profile").then(r => r.json()).then(d => {
      if (d.user) setCurrentUserId(d.user.id);
    });
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, type: string = "TEXT", fileUrl?: string) => {
    e?.preventDefault();
    if (type === "TEXT" && !inputValue.trim()) return;

    const content = inputValue;
    if (type === "TEXT") setInputValue(""); 
    setShowAttachments(false);
    setShowEmojis(false);

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: type === "TEXT" ? content : (content || null), 
          messageType: type, 
          fileUrl 
        })
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send", error);
    }
  };

  const handleAttachment = (type: string) => {
    if (type === "LOCATION") {
      const loc = "https://maps.googleapis.com/maps/api/staticmap?center=40.714728,-73.998672&zoom=14&size=400x200&key=YOUR_API_KEY"; // Dummy URL
      handleSend(undefined, "LOCATION", loc);
      return;
    }

    const url = prompt(`Enter the URL of the ${type.toLowerCase()} you want to send:`);
    if (url) {
      handleSend(undefined, type, url);
    }
  };

  const filteredMessages = messages.filter(msg => 
    (msg.content && msg.content.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (!searchQuery)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative", background: "var(--color-bg-base)" }}>
      {/* Premium Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg-glass)", backdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "50%", background: "var(--color-primary-light)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)",
            overflow: "hidden", fontWeight: 700, fontSize: "1.2rem", border: "2px solid var(--color-bg-base)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            {otherUser?.avatar ? (
              <img src={otherUser.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              otherUser?.name?.charAt(0).toUpperCase() || "?"
            )}
          </div>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>
              {otherUser?.name || "Loading..."}
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 600 }}>
              Active Now
            </p>
          </div>
        </div>

        <div style={{ position: "relative" }}>
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
              <div className="glass animate-scale-in" style={{
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
                <button className="hover-bg" style={{
                  display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none",
                  padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "var(--color-text-main)", fontWeight: 600, fontSize: "1rem"
                }}>
                  <Info size={18} /> View Profile
                </button>
                <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />
                <button className="hover-bg" style={{
                  display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none",
                  padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "#ff4d4d", fontWeight: 600, fontSize: "1rem"
                }}>
                  <Trash2 size={18} /> Delete Chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inline Search Bar */}
      {showSearch && (
        <div className="animate-fade-in" style={{
          padding: "12px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-surface)",
          display: "flex", alignItems: "center", gap: "12px"
        }}>
          <Search size={18} color="var(--color-text-muted)" />
          <input 
            type="text" placeholder="Search messages..." autoFocus
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--color-text-main)", fontSize: "1rem" }}
          />
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} style={{
            background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer"
          }}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div style={{ 
        flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px",
        backgroundImage: "radial-gradient(circle at center, rgba(29, 155, 240, 0.03) 0%, transparent 70%)"
      }}>
        {filteredMessages.length === 0 && searchQuery ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
            No messages found for "{searchQuery}"
          </div>
        ) : filteredMessages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)", margin: "auto" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-primary-light)", margin: "0 auto 16px auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "2rem" }}>👋</span>
            </div>
            <p style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--color-text-main)" }}>Say hello!</p>
            <p>Start the conversation with {otherUser?.name}</p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isMe = msg.sender.id === currentUserId;
            const prevMsg = filteredMessages[index - 1];
            const isFirstInGroup = !prevMsg || prevMsg.sender.id !== msg.sender.id;

            return (
              <div key={msg.id} className="animate-fade-in" style={{ 
                display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start",
                marginTop: isFirstInGroup ? "8px" : "2px"
              }}>
                <div style={{
                  maxWidth: "75%",
                  padding: msg.messageType === "STICKER" ? "0" : "12px 18px",
                  borderRadius: msg.messageType === "STICKER" ? "0" : "24px",
                  borderBottomRightRadius: isMe && msg.messageType !== "STICKER" ? "4px" : (msg.messageType !== "STICKER" ? "24px" : "0"),
                  borderBottomLeftRadius: !isMe && msg.messageType !== "STICKER" ? "4px" : (msg.messageType !== "STICKER" ? "24px" : "0"),
                  background: msg.messageType === "STICKER" ? "transparent" : (isMe ? "linear-gradient(135deg, var(--color-primary), #4facfe)" : "var(--color-bg-surface)"),
                  color: isMe ? "white" : "var(--color-text-main)",
                  border: isMe || msg.messageType === "STICKER" ? "none" : "1px solid var(--color-border)",
                  fontSize: "1.05rem",
                  boxShadow: msg.messageType === "STICKER" ? "none" : (isMe ? "0 4px 12px rgba(29, 155, 240, 0.2)" : "0 2px 8px rgba(0,0,0,0.05)"),
                  lineHeight: "1.4",
                  overflow: "hidden"
                }}>
                  {msg.messageType === "TEXT" && msg.content}
                  {msg.messageType === "IMAGE" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <img src={msg.fileUrl} alt="Image" style={{ width: "100%", maxHeight: "300px", borderRadius: "12px", objectFit: "cover" }} />
                      {msg.content && <span>{msg.content}</span>}
                    </div>
                  )}
                  {msg.messageType === "VIDEO" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <video src={msg.fileUrl} controls style={{ width: "100%", maxHeight: "300px", borderRadius: "12px", outline: "none" }} />
                      {msg.content && <span>{msg.content}</span>}
                    </div>
                  )}
                  {msg.messageType === "LOCATION" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ width: "100%", height: "150px", background: "url('https://maps.googleapis.com/maps/api/staticmap?center=New+York,NY&zoom=13&size=400x200&sensor=false') center/cover", borderRadius: "12px" }} />
                      <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={16} /> Shared Location</span>
                      {msg.content && <span style={{ fontSize: "0.95rem" }}>{msg.content}</span>}
                    </div>
                  )}
                  {msg.messageType === "STICKER" && (
                    <img src={msg.fileUrl} alt="Sticker" style={{ width: "150px", height: "150px", objectFit: "contain" }} />
                  )}
                </div>
                {isFirstInGroup && (
                   <span style={{ 
                     fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "6px", 
                     padding: isMe ? "0 8px 0 0" : "0 0 0 8px", fontWeight: 500
                   }}>
                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        padding: "16px 24px 24px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-base)", position: "relative" 
      }}>
        
        {/* Emoji Popover */}
        {showEmojis && (
          <div className="glass animate-scale-in" style={{
            position: "absolute", bottom: "100%", left: "24px", marginBottom: "12px",
            background: "var(--color-bg-surface)", padding: "16px", borderRadius: "16px",
            border: "1px solid var(--color-border)", boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", zIndex: 100
          }}>
            {EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => setInputValue(prev => prev + emoji)} style={{
                background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", 
                width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center"
              }} className="hover-bg">
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Attachments Popover */}
        {showAttachments && (
          <div className="glass animate-scale-in" style={{
            position: "absolute", bottom: "100%", left: "64px", marginBottom: "12px",
            background: "var(--color-bg-surface)", padding: "8px", borderRadius: "16px",
            border: "1px solid var(--color-border)", boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px", zIndex: 100
          }}>
            <button onClick={() => handleAttachment("IMAGE")} className="hover-bg" style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "var(--color-text-main)", fontWeight: 600 }}>
              <ImageIcon size={18} color="#4facfe" /> Send Image
            </button>
            <button onClick={() => handleAttachment("VIDEO")} className="hover-bg" style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "var(--color-text-main)", fontWeight: 600 }}>
              <Video size={18} color="#ff6b6b" /> Send Video
            </button>
            <button onClick={() => handleAttachment("LOCATION")} className="hover-bg" style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "var(--color-text-main)", fontWeight: 600 }}>
              <MapPin size={18} color="#1dd1a1" /> Send Location
            </button>
            <button onClick={() => handleAttachment("STICKER")} className="hover-bg" style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", padding: "12px 16px", borderRadius: "12px", cursor: "pointer", color: "var(--color-text-main)", fontWeight: 600 }}>
              <Sticker size={18} color="#feca57" /> Send Sticker
            </button>
          </div>
        )}

        <form onSubmit={(e) => handleSend(e, "TEXT")} style={{ 
          display: "flex", gap: "8px", background: "var(--color-bg-surface)", padding: "8px 8px 8px 16px", 
          borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)", alignItems: "center", transition: "all 0.2s"
        }}>
          
          <button type="button" onClick={() => { setShowEmojis(!showEmojis); setShowAttachments(false); }} style={{
            background: "none", border: "none", color: showEmojis ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer",
            width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
          }} className="hover-bg">
            <Smile size={22} />
          </button>
          
          <button type="button" onClick={() => { setShowAttachments(!showAttachments); setShowEmojis(false); }} style={{
            background: "none", border: "none", color: showAttachments ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer",
            width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
          }} className="hover-bg">
            <Paperclip size={22} />
          </button>

          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            style={{ 
              flex: 1, background: "transparent", border: "none", color: "var(--color-text-main)", 
              outline: "none", fontSize: "1.05rem", padding: "0 8px"
            }}
          />
          <button type="submit" disabled={!inputValue.trim()} style={{
            background: inputValue.trim() ? "var(--color-primary)" : "var(--color-bg-base)",
            color: inputValue.trim() ? "white" : "var(--color-text-muted)",
            border: "none", borderRadius: "50%", width: "44px", height: "44px",
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
