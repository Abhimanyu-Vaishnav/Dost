"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Bot, RefreshCw, Copy, Check } from "lucide-react";

export interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onInsertToPost?: (text: string) => void;
}

export function AIChatModal({ isOpen, onClose, initialPrompt = "", onInsertToPost }: AIChatModalProps) {
  const [messages, setMessages] = useState<Array<{ id: string; sender: "user" | "ai"; text: string; time: string }>>([
    {
      id: "init_1",
      sender: "ai",
      text: "Hello! I'm **DOST AI Companion** 🤖✨. Ask me anything, generate post ideas, refine your captions, or get viral hashtags!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMsgText = inputText.trim();
    const userMsg = {
      id: `msg_${Date.now()}`,
      sender: "user" as const,
      text: userMsgText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          prompt: userMsgText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg = {
          id: `msg_ai_${Date.now()}`,
          sender: "ai" as const,
          text: data.reply || "I am here to help you on DOST! ✨",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error("AI Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(12px)",
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 520,
            height: "600px",
            maxHeight: "90vh",
            backgroundColor: "#0d1017",
            border: "1px solid rgba(0, 242, 254, 0.35)",
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(0, 242, 254, 0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "rgba(16, 18, 24, 0.9)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #00f2fe 0%, #7b2cbf 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 0 16px rgba(0, 242, 254, 0.4)",
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  DOST AI Assistant <Sparkles size={16} color="#00f2fe" />
                </h3>
                <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>● Online & Ready</span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 6 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Prompts */}
          <div style={{ padding: "10px 16px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", gap: 8, overflowX: "auto" }}>
            {[
              "💡 Viral post idea",
              "😂 Write a funny joke",
              "🚀 Growth tip",
              "✨ Make caption catchy",
            ].map((tag, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(tag.replace(/^[^\s]+\s/, ""))}
                style={{
                  padding: "5px 12px",
                  borderRadius: 9999,
                  backgroundColor: "rgba(0, 242, 254, 0.08)",
                  border: "1px solid rgba(0, 242, 254, 0.25)",
                  color: "#00f2fe",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isAi ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "12px 16px",
                      borderRadius: isAi ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                      background: isAi ? "rgba(24, 28, 36, 0.9)" : "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                      color: isAi ? "#f8fafc" : "#000000",
                      fontWeight: isAi ? 400 : 600,
                      border: isAi ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                      fontSize: "0.9rem",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      boxShadow: isAi ? "0 4px 14px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0, 242, 254, 0.3)",
                    }}
                  >
                    {msg.text}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, padding: "0 4px" }}>
                    <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{msg.time}</span>
                    {isAi && (
                      <>
                        <button
                          onClick={() => copyText(msg.id, msg.text)}
                          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                          title="Copy"
                        >
                          {copiedId === msg.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>

                        {onInsertToPost && (
                          <button
                            onClick={() => {
                              onInsertToPost(msg.text);
                              onClose();
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#00f2fe",
                              cursor: "pointer",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: 0,
                            }}
                          >
                            + Use in Post
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#00f2fe", fontSize: "0.8rem", fontWeight: 600 }}>
                <RefreshCw size={16} className="animate-spin" /> DOST AI is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(16, 18, 24, 0.95)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <input
              type="text"
              placeholder="Ask DOST AI anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 9999,
                padding: "10px 16px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />

            <button
              onClick={handleSendMessage}
              disabled={loading || !inputText.trim()}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                border: "none",
                color: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: loading || !inputText.trim() ? "not-allowed" : "pointer",
                opacity: loading || !inputText.trim() ? 0.5 : 1,
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
