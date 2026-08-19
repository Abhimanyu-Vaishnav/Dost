"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, Video, Search, MoreVertical, Trash2, X } from "lucide-react";

export interface ChatHeaderProps {
  name: string;
  avatar: string;
  isOnline?: boolean;
  lastSeen?: string | Date;
  isTyping?: boolean;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onSearchToggle?: () => void;
  onDeleteChat?: () => void;
}

export function ChatHeader({
  name,
  avatar,
  isOnline = false,
  lastSeen,
  isTyping = false,
  onVoiceCall,
  onVideoCall,
  onSearchToggle,
  onDeleteChat,
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  const renderStatus = () => {
    if (isTyping) {
      return (
        <span style={{ color: "#00f2fe", fontWeight: 600, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            typing...
          </motion.span>
        </span>
      );
    }
    if (isOnline) {
      return (
        <span style={{ color: "#10b981", fontWeight: 600, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, backgroundColor: "#10b981", borderRadius: "50%", boxShadow: "0 0 8px #10b981" }} />
          Online
        </span>
      );
    }
    if (lastSeen) {
      const date = new Date(lastSeen);
      const isToday = date.toDateString() === new Date().toDateString();
      const timeStr = isToday
        ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString([], { month: "short", day: "numeric" });
      return <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Last seen {timeStr}</span>;
    }
    return <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Offline</span>;
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        backgroundColor: "rgba(12, 14, 18, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Back Link for Mobile */}
        <Link href="/messages" style={{ display: "flex", textDecoration: "none" }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            style={{
              padding: 8,
              borderRadius: 10,
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              color: "#cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} />
          </motion.div>
        </Link>

        {/* Avatar */}
        <div style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
          <img
            src={avatar}
            alt={name}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          />
          {isOnline ? (
            <span
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 11,
                height: 11,
                backgroundColor: "#10b981",
                border: "2px solid #0c0e12",
                borderRadius: "50%",
                boxShadow: "0 0 6px #10b981",
              }}
            />
          ) : null}
        </div>

        {/* User Info */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc", margin: 0, letterSpacing: "-0.01em" }}>
            {name}
          </h3>
          {renderStatus()}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
        {/* Message Search Button */}
        {onSearchToggle ? (
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onSearchToggle}
            style={{
              padding: 9,
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#cbd5e1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Search Messages"
          >
            <Search size={17} />
          </motion.button>
        ) : null}

        {/* Voice Call Button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onVoiceCall}
          style={{
            padding: 9,
            borderRadius: 12,
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#00f2fe",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Start Voice Call"
        >
          <Phone size={17} />
        </motion.button>

        {/* Video Call Button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onVideoCall}
          style={{
            padding: 9,
            borderRadius: 12,
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#00f2fe",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Start Video Call"
        >
          <Video size={17} />
        </motion.button>

        {/* Options Menu Toggle */}
        {onDeleteChat ? (
          <div style={{ position: "relative" }}>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowMenu(!showMenu)}
              style={{
                padding: 9,
                borderRadius: 12,
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#cbd5e1",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Chat Options"
            >
              <MoreVertical size={17} />
            </motion.button>

            <AnimatePresence>
              {showMenu ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 8,
                    padding: 6,
                    backgroundColor: "#0d1017",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 14,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                    minWidth: 160,
                    zIndex: 50,
                  }}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteChat();
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      fontSize: "0.78rem",
                      color: "#f87171",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 8,
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    <Trash2 size={15} /> Delete Conversation
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </header>
  );
}
