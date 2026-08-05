"use client";

import { X } from "lucide-react";
import { CreatePost } from "./CreatePost";

interface CreatePostModalProps {
  onClose: () => void;
  userName?: string;
  userAvatar?: string | null;
  initialDraft?: string;
}

export function CreatePostModal({ onClose, userName, userAvatar, initialDraft }: CreatePostModalProps) {
  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)", display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 1200, backdropFilter: "blur(8px)", padding: "16px"
      }} 
      onClick={onClose}
    >
      <div 
        className="glass animate-slide-up" 
        style={{
          width: "100%", maxWidth: "600px", maxHeight: "85vh",
          borderRadius: "20px", display: "flex", flexDirection: "column",
          border: "1px solid var(--color-border)", background: "var(--color-bg-base)",
          marginTop: "40px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5)",
          overflow: "hidden"
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Row: ✕ Close Icon on Left, Drafts on Right */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px"
        }}>
          <button
            onClick={onClose}
            style={{
              color: "var(--color-text-main)", background: "none", border: "none",
              cursor: "pointer", padding: "6px", borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}
            className="hover-bg"
          >
            <X size={20} />
          </button>
          
          <button
            type="button"
            onClick={() => alert("Drafts feature coming soon!")}
            style={{
              background: "none", border: "none", color: "var(--color-primary)",
              fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", padding: "4px 8px"
            }}
            className="hover-bg"
          >
            Drafts
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <CreatePost 
            userName={userName || "User"} 
            userAvatar={userAvatar}
            initialDraft={initialDraft}
            isModal={true}
            onPostSuccess={() => {
              onClose();
            }} 
          />
        </div>
      </div>
    </div>
  );
}
