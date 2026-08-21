"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCall } from "@/context/CallContext";
import {
  Check,
  CheckCheck,
  Reply,
  Copy,
  Edit2,
  Trash2,
  Play,
  Pause,
  Download,
  FileText,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Disc,
} from "lucide-react";

export interface MessageBubbleProps {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content?: string | null;
  type?: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE" | "SYSTEM";
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  replyTo?: {
    id: string;
    content?: string | null;
    senderName?: string;
  } | null;
  status?: "SENT" | "DELIVERED" | "READ";
  isMe: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  onReply?: (msg: { id: string; content?: string | null; senderName?: string }) => void;
  onEdit?: (msg: { id: string; content?: string | null }) => void;
  onDelete?: (msgId: string, mode: "everyone" | "me") => void;
}

export function MessageBubble({
  id,
  senderId,
  senderName,
  senderAvatar,
  content,
  type = "TEXT",
  mediaUrl,
  fileName,
  fileSize,
  replyTo,
  status = "SENT",
  isMe,
  createdAt,
  updatedAt,
  onReply,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const { startCall } = useCall();
  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isEditable = isMe && Date.now() - new Date(createdAt).getTime() <= 15 * 60 * 1000;

  const toggleAudio = () => {
    if (!mediaUrl) return;
    if (!audioRef) {
      const audio = new Audio(mediaUrl);
      audio.onended = () => setIsPlayingAudio(false);
      setAudioRef(audio);
      audio.play();
      setIsPlayingAudio(true);
    } else {
      if (isPlayingAudio) {
        audioRef.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const copyToClipboard = () => {
    if (content) {
      navigator.clipboard.writeText(content);
    }
    setShowMenu(false);
  };

  const renderReadStatus = () => {
    if (!isMe) return null;

    if (status === "READ") {
      return (
        <span title="Read">
          <CheckCheck size={14} style={{ color: "#7dd3fc" }} />
        </span>
      );
    }
    if (status === "DELIVERED") {
      return (
        <span title="Delivered">
          <CheckCheck size={14} style={{ color: "#cbd5e1" }} />
        </span>
      );
    }
    return (
      <span title="Sent">
        <Check size={14} style={{ color: "#cbd5e1" }} />
      </span>
    );
  };

  // Check if content is a Call History item
  const isCallEvent = type === "SYSTEM" && (
    content?.includes("call") ||
    content?.includes("📞") ||
    content?.includes("📹") ||
    content?.includes("📵") ||
    content?.includes("⚠️")
  );

  if (isCallEvent || type === "SYSTEM") {
    const isVideoCall = content?.toLowerCase().includes("video");
    const isMissed = content?.toLowerCase().includes("missed") || content?.toLowerCase().includes("declined");

    return (
      <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 16px",
            backgroundColor: "rgba(13, 16, 23, 0.8)",
            border: isMissed ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(0, 242, 254, 0.25)",
            borderRadius: "16px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            maxWidth: "360px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: isMissed ? "rgba(239, 68, 68, 0.15)" : "rgba(0, 242, 254, 0.15)",
              color: isMissed ? "#ef4444" : "#00f2fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isMissed ? (
              <PhoneMissed size={16} />
            ) : isVideoCall ? (
              <Video size={16} />
            ) : (
              <Phone size={16} />
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff" }}>
              {content}
            </span>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
              {formattedTime}
            </span>
          </div>

          {senderId && senderId !== "SYSTEM" && (
            <button
              onClick={() =>
                startCall(
                  { id: senderId, name: senderName || "Friend", avatar: senderAvatar || "" },
                  isVideoCall ? "VIDEO" : "VOICE"
                )
              }
              style={{
                padding: "5px 10px",
                borderRadius: "99px",
                backgroundColor: "rgba(0, 242, 254, 0.15)",
                border: "1px solid rgba(0, 242, 254, 0.35)",
                color: "#00f2fe",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Call Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        margin: "4px 0",
        alignItems: isMe ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "520px",
          width: "auto",
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
      >
        {/* Reply Preview Header */}
        {replyTo ? (
          <div
            style={{
              marginBottom: "4px",
              padding: "6px 10px",
              borderRadius: "10px",
              fontSize: "0.75rem",
              backgroundColor: isMe ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.08)",
              borderLeft: "3px solid #00f2fe",
              color: "#e2e8f0",
            }}
          >
            <span style={{ fontWeight: 700, color: "#00f2fe", display: "block" }}>
              {replyTo.senderName || "User"}
            </span>
            <p style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: 0.85 }}>
              {replyTo.content || "Attachment"}
            </p>
          </div>
        ) : null}

        {/* Message Bubble Container */}
        <div
          style={{
            position: "relative",
            padding: "12px 16px",
            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            background: isMe
              ? "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)"
              : "rgba(24, 28, 36, 0.9)",
            color: isMe ? "#000000" : "#f8fafc",
            fontWeight: isMe ? 600 : 400,
            border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: isMe ? "0 4px 16px rgba(0, 242, 254, 0.25)" : "0 4px 14px rgba(0,0,0,0.3)",
            wordBreak: "break-word",
          }}
        >
          {/* Image Attachment */}
          {type === "IMAGE" && mediaUrl ? (
            <div style={{ marginBottom: "6px", overflow: "hidden", borderRadius: "12px", maxWidth: "380px" }}>
              <img
                src={mediaUrl}
                alt="Media"
                style={{ maxHeight: "280px", width: "100%", objectFit: "cover", borderRadius: "12px" }}
              />
            </div>
          ) : null}

          {/* Video Attachment */}
          {type === "VIDEO" && mediaUrl ? (
            <div style={{ marginBottom: "6px", overflow: "hidden", borderRadius: "12px", maxWidth: "380px" }}>
              <video src={mediaUrl} controls style={{ maxHeight: "280px", width: "100%", borderRadius: "12px" }} />
            </div>
          ) : null}

          {/* Audio / Voice Recording Attachment */}
          {type === "AUDIO" && mediaUrl ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                backgroundColor: isMe ? "rgba(0, 0, 0, 0.12)" : "rgba(0, 242, 254, 0.08)",
                borderRadius: "12px",
                minWidth: "220px",
                border: isMe ? "none" : "1px solid rgba(0, 242, 254, 0.2)",
              }}
            >
              <button
                onClick={toggleAudio}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  backgroundColor: "#00f2fe",
                  border: "none",
                  color: "#000",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0, 242, 254, 0.4)",
                  flexShrink: 0,
                }}
              >
                {isPlayingAudio ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <Disc size={14} color="#00f2fe" /> Call Recording
                </span>
                <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                  {fileName || "Voice call audio recording"}
                </span>
              </div>
            </div>
          ) : null}

          {/* File Attachment */}
          {type === "FILE" && mediaUrl ? (
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                backgroundColor: "rgba(0,0,0,0.15)",
                borderRadius: "12px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <FileText size={20} />
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {fileName || "File"}
                </span>
                {fileSize ? (
                  <span style={{ fontSize: "0.68rem", opacity: 0.7 }}>
                    {(fileSize / 1024).toFixed(1)} KB
                  </span>
                ) : null}
              </div>
              <Download size={15} />
            </a>
          ) : null}

          {/* Text Content */}
          {content && type !== "AUDIO" ? (
            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
              {content}
            </p>
          ) : null}

          {/* Time & Read Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "4px",
              marginTop: "4px",
              fontSize: "0.68rem",
              opacity: 0.75,
            }}
          >
            <span>{formattedTime}</span>
            {renderReadStatus()}
          </div>
        </div>

        {/* Hover Context Menu */}
        <AnimatePresence>
          {showMenu ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: "absolute",
                top: "100%",
                right: isMe ? 0 : "auto",
                left: isMe ? "auto" : 0,
                zIndex: 50,
                marginTop: "4px",
                padding: "4px",
                backgroundColor: "#0d1017",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <button
                onClick={() => {
                  onReply?.({ id, content, senderName });
                  setShowMenu(false);
                }}
                style={{ padding: "6px", background: "none", border: "none", color: "#cbd5e1", cursor: "pointer" }}
                title="Reply"
              >
                <Reply size={15} />
              </button>

              <button
                onClick={copyToClipboard}
                style={{ padding: "6px", background: "none", border: "none", color: "#cbd5e1", cursor: "pointer" }}
                title="Copy"
              >
                <Copy size={15} />
              </button>

              {isEditable ? (
                <button
                  onClick={() => {
                    onEdit?.({ id, content });
                    setShowMenu(false);
                  }}
                  style={{ padding: "6px", background: "none", border: "none", color: "#cbd5e1", cursor: "pointer" }}
                  title="Edit"
                >
                  <Edit2 size={15} />
                </button>
              ) : null}

              <button
                onClick={() => {
                  onDelete?.(id, isMe ? "everyone" : "me");
                  setShowMenu(false);
                }}
                style={{ padding: "6px", background: "none", border: "none", color: "#f87171", cursor: "pointer" }}
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
