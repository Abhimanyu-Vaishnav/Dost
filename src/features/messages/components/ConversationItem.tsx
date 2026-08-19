"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, CheckCheck, Image as ImageIcon, Mic, FileText } from "lucide-react";

export interface ConversationItemProps {
  id: string;
  name: string;
  avatar: string;
  isOnline?: boolean;
  isTyping?: boolean;
  unreadCount?: number;
  lastMessage?: {
    content?: string | null;
    type?: string;
    mediaUrl?: string | null;
    createdAt?: string | Date;
    senderId?: string;
  } | null;
  updatedAt?: string | Date;
  isActive?: boolean;
  currentUserId?: string;
}

export function ConversationItem({
  id,
  name,
  avatar,
  isOnline = false,
  isTyping = false,
  unreadCount = 0,
  lastMessage,
  updatedAt,
  isActive = false,
  currentUserId,
}: ConversationItemProps) {
  const isMe = lastMessage?.senderId === currentUserId;

  const renderLastMessagePreview = () => {
    if (isTyping) {
      return (
        <span className="text-cyan-400 font-medium animate-pulse flex items-center gap-1 text-xs">
          <span>typing</span>
          <span className="flex gap-[2px]">
            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </span>
      );
    }

    if (!lastMessage) {
      return <span className="text-slate-400 italic text-xs">Tap to start conversation</span>;
    }

    let textPreview = lastMessage.content || "";
    if (lastMessage.type === "IMAGE") {
      textPreview = "📷 Photo";
    } else if (lastMessage.type === "VIDEO") {
      textPreview = "🎥 Video";
    } else if (lastMessage.type === "AUDIO") {
      textPreview = "🎤 Voice Note";
    } else if (lastMessage.type === "FILE") {
      textPreview = "📁 Document";
    }

    return (
      <span className="text-slate-300 dark:text-slate-400 truncate text-xs flex items-center gap-1">
        {isMe && <span className="text-cyan-400 font-medium">You: </span>}
        {textPreview}
      </span>
    );
  };

  const formattedTime = () => {
    const rawDate = lastMessage?.createdAt || updatedAt;
    if (!rawDate) return "";
    const date = new Date(rawDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <Link href={`/messages/${id}`}>
      <motion.div
        whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        whileTap={{ scale: 0.99 }}
        className={`relative flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border border-transparent ${
          isActive
            ? "bg-cyan-500/15 border-cyan-500/30 shadow-lg shadow-cyan-500/5 backdrop-blur-md"
            : "hover:bg-white/5"
        }`}
      >
        {/* Avatar with Ring & Presence */}
        <div className="relative flex-shrink-0">
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-sm"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm shadow-emerald-500/50" />
          )}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-slate-100 truncate text-sm tracking-tight">{name}</h4>
            <span className="text-[11px] text-slate-400 flex-shrink-0 font-medium">{formattedTime()}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="truncate">{renderLastMessagePreview()}</div>

            {/* Unread Badge */}
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-[11px] rounded-full shadow-md shadow-cyan-500/30 flex-shrink-0"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
