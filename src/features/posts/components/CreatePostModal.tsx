"use client";

import { X } from "lucide-react";
import { CreatePost } from "./CreatePost";

interface CreatePostModalProps {
  onClose: () => void;
  userName?: string;
}

export function CreatePostModal({ onClose, userName }: CreatePostModalProps) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center",
      zIndex: 1100, backdropFilter: "blur(4px)", padding: "20px"
    }} onClick={onClose}>
      <div className="glass animate-slide-up" style={{
        width: "100%", maxWidth: "600px", padding: "0", borderRadius: "16px",
        display: "flex", flexDirection: "column", border: "1px solid var(--color-border)",
        background: "var(--color-bg-base)", marginTop: "40px"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
           <button onClick={onClose} style={{ color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
           <h3 style={{ fontWeight: 800 }}>Draft</h3>
           <div style={{ width: "20px" }}></div>
        </div>
        <div style={{ padding: "16px" }}>
          <CreatePost userName={userName || "User"} onPostSuccess={() => {
            onClose();
          }} />
        </div>
      </div>
    </div>
  );
}
