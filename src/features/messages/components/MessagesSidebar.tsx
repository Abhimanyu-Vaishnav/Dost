"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Search, Plus, Check, Circle } from "lucide-react";
import { NewChatModal } from "./NewChatModal";

export function MessagesSidebar() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  
  const params = useParams();
  const currentConversationId = params?.id as string;

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/messages/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleMarkRead = async (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}/mark-read`, {
        method: "POST"
      });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  const handleMarkUnread = async (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}/mark-unread`, {
        method: "POST"
      });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to mark unread", error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.participants[0] || { name: "Unknown" };
    const lastMessage = conv.messages[0]?.content || "";
    const q = searchQuery.toLowerCase();
    return otherUser.name?.toLowerCase().includes(q) || lastMessage.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="messages-sidebar" style={{
        width: "350px", minWidth: "350px", height: "100%", display: "flex", flexDirection: "column",
        borderRight: "1px solid var(--color-border)", background: "var(--color-bg-surface)"
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 20px 16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>Messages</h2>
          <button onClick={() => setShowNewChatModal(true)} style={{
            background: "var(--color-primary)", color: "white", border: "none", cursor: "pointer",
            width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(29, 155, 240, 0.3)", transition: "transform 0.2s"
          }} className="hover-scale">
            <Plus size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "0 20px 16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", background: "var(--color-bg-base)",
            padding: "10px 16px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)",
            transition: "all 0.2s"
          }}>
            <Search size={18} color="var(--color-text-muted)" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, background: "transparent", border: "none", color: "var(--color-text-main)",
                outline: "none", fontSize: "0.95rem"
              }}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 12px" }}>
          {filteredConversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-muted)" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>No messages found</p>
              <p style={{ fontSize: "0.9rem", marginTop: "8px" }}>Try a different search term or start a new chat.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherUser = conv.participants[0] || { name: "Unknown", avatar: null };
              const lastMessage = conv.messages[0];
              const isActive = conv.id === currentConversationId;

              return (
                <Link key={conv.id} href={`/messages/${conv.id}`} style={{ textDecoration: "none" }}>
                  <div 
                    onMouseEnter={() => setHoveredConversationId(conv.id)}
                    onMouseLeave={() => setHoveredConversationId(null)}
                    style={{
                      padding: "14px 16px", display: "flex", gap: "16px", alignItems: "center",
                      background: isActive ? "var(--color-bg-base)" : "transparent",
                      borderRadius: "16px", marginBottom: "4px",
                      border: isActive ? "1px solid var(--color-primary)" : "1px solid transparent",
                      boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.2s"
                    }} 
                    className="hover-bg"
                  >
                    
                    <div style={{
                      width: "52px", height: "52px", borderRadius: "50%", background: "var(--color-primary-light)",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", 
                      flexShrink: 0, overflow: "hidden", fontSize: "1.2rem", fontWeight: 700
                    }}>
                      {otherUser.avatar ? (
                        <img src={otherUser.avatar} alt={otherUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        otherUser.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "1.05rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {otherUser.name}
                        </span>
                        {lastMessage && (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {new Date(lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{
                          margin: 0, 
                          color: (isActive || conv.unreadCount > 0) ? "var(--color-text-main)" : "var(--color-text-muted)", 
                          fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          fontWeight: (isActive || conv.unreadCount > 0) ? 600 : 400,
                          flex: 1
                        }}>
                          {lastMessage ? lastMessage.content : "Started a conversation"}
                        </p>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px", minWidth: "22px", justifyContent: "flex-end" }}>
                          {hoveredConversationId === conv.id ? (
                            conv.unreadCount > 0 ? (
                              <button 
                                onClick={(e) => handleMarkRead(e, conv.id)}
                                title="Mark as Read"
                                style={{
                                  background: "var(--color-primary-light)", border: "none", color: "var(--color-primary)",
                                  cursor: "pointer", width: "22px", height: "22px", borderRadius: "50%",
                                  display: "flex", alignItems: "center", justifyContent: "center", padding: 0
                                }}
                              >
                                <Check size={14} />
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => handleMarkUnread(e, conv.id)}
                                title="Mark as Unread"
                                style={{
                                  background: "var(--color-border)", border: "none", color: "var(--color-text-muted)",
                                  cursor: "pointer", width: "22px", height: "22px", borderRadius: "50%",
                                  display: "flex", alignItems: "center", justifyContent: "center", padding: 0
                                }}
                              >
                                <Circle size={8} fill="var(--color-text-muted)" />
                              </button>
                            )
                          ) : (
                            conv.unreadCount > 0 && (
                              <div style={{
                                background: "var(--color-primary)", color: "white",
                                borderRadius: "50%", minWidth: "18px", height: "18px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.7rem", fontWeight: 800, padding: "0 5px"
                              }}>
                                {conv.unreadCount}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {showNewChatModal && <NewChatModal isOpen={showNewChatModal} onClose={() => setShowNewChatModal(false)} />}
    </>
  );
}
