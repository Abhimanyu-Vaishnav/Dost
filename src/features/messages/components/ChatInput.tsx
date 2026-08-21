"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Smile,
  X,
  ImageIcon,
  FileText,
  Check,
  Gamepad2,
  Sparkles,
} from "lucide-react";

export interface ChatInputProps {
  onSendMessage: (payload: {
    content?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
  }) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  replyTo?: { id: string; content?: string | null; senderName?: string } | null;
  onCancelReply?: () => void;
  editingMessage?: { id: string; content?: string | null } | null;
  onCancelEdit?: () => void;
  onSaveEdit?: (messageId: string, newContent: string) => void;
  onLaunchGame?: () => void;
  onOpenAi?: () => void;
}

export function ChatInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
  onLaunchGame,
  onOpenAi,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || "");
    }
  }, [editingMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    if (onTypingStart) {
      onTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingStop) {
        onTypingStop();
      }
    }, 2000);
  };

  const handleSend = () => {
    if (editingMessage) {
      if (text.trim() && onSaveEdit) {
        onSaveEdit(editingMessage.id, text.trim());
        setText("");
      }
      return;
    }

    if (!text.trim()) return;

    onSendMessage({
      content: text.trim(),
      replyToId: replyTo?.id,
    });

    setText("");
    if (onCancelReply) onCancelReply();
    if (onTypingStop) onTypingStop();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSendMessage({
        mediaUrl: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        replyToId: replyTo?.id,
      });
      setShowAttachments(false);
      if (onCancelReply) onCancelReply();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 50,
        padding: "10px 14px",
        backgroundColor: "#0c0e12",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flexShrink: 0,
      }}
    >
      {/* Reply Banner */}
      <AnimatePresence>
        {replyTo ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: "rgba(0, 242, 254, 0.1)",
              borderLeft: "3px solid #00f2fe",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00f2fe" }}>
                Replying to {replyTo.senderName || "User"}
              </span>
              <span style={{ fontSize: "0.78rem", color: "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {replyTo.content || "Attachment"}
              </span>
            </div>
            <button
              onClick={onCancelReply}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Edit Banner */}
      <AnimatePresence>
        {editingMessage ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              borderLeft: "3px solid #f59e0b",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b" }}>
                Editing Message
              </span>
              <span style={{ fontSize: "0.78rem", color: "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {editingMessage.content}
              </span>
            </div>
            <button
              onClick={onCancelEdit}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Main Controls Row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

        {/* Attachment Toggle */}
        <div style={{ position: "relative" }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAttachments(!showAttachments)}
            style={{
              padding: "10px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#cbd5e1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Paperclip size={18} />
          </motion.button>

          {/* Attachments Menu */}
          <AnimatePresence>
            {showAttachments ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: -5 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: "8px",
                  padding: "8px",
                  backgroundColor: "#0d1017",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "16px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  minWidth: "150px",
                  zIndex: 50,
                }}
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "0.78rem",
                    color: "#f1f5f9",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "10px",
                    textAlign: "left",
                  }}
                >
                  <ImageIcon size={15} style={{ color: "#00f2fe" }} /> Image / Media
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "0.78rem",
                    color: "#f1f5f9",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "10px",
                    textAlign: "left",
                  }}
                >
                  <FileText size={15} style={{ color: "#00f2fe" }} /> Document
                </button>
                <button
                  onClick={() => {
                    setShowAttachments(false);
                    onLaunchGame?.();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "0.78rem",
                    color: "#f1f5f9",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "10px",
                    textAlign: "left",
                  }}
                >
                  <Gamepad2 size={15} style={{ color: "#8b5cf6" }} /> Play 1v1 Game
                </button>
                <button
                  onClick={() => {
                    setShowAttachments(false);
                    onOpenAi?.();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "0.78rem",
                    color: "#f1f5f9",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "10px",
                    textAlign: "left",
                  }}
                >
                  <Sparkles size={15} style={{ color: "#00f2fe" }} /> DOST AI Assistant
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Text Input Box */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            style={{
              width: "100%",
              padding: "12px 40px 12px 18px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "9999px",
              color: "#ffffff",
              fontSize: "0.88rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <button
            type="button"
            style={{
              position: "absolute",
              right: "14px",
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <Smile size={18} />
          </button>
        </div>

        {/* Send Button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleSend}
          disabled={!text.trim() && !editingMessage}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: text.trim() || editingMessage ? "linear-gradient(135deg, #00f2fe, #4facfe)" : "rgba(255, 255, 255, 0.08)",
            border: "none",
            color: text.trim() || editingMessage ? "#000000" : "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: text.trim() || editingMessage ? "pointer" : "not-allowed",
            boxShadow: text.trim() || editingMessage ? "0 4px 16px rgba(0, 242, 254, 0.4)" : "none",
            flexShrink: 0,
          }}
        >
          {editingMessage ? <Check size={18} /> : <Send size={17} />}
        </motion.button>
      </div>
    </div>
  );
}
