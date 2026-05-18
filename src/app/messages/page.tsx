"use client";

import { MessageSquareDashed } from "lucide-react";

export default function MessagesEmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", width: "100%", padding: "var(--space-8)", textAlign: "center",
      background: "var(--color-bg-base)",
      backgroundImage: "radial-gradient(circle at center, rgba(29, 155, 240, 0.05) 0%, transparent 60%)"
    }}>
      <div className="animate-scale-in" style={{
        width: "120px", height: "120px", borderRadius: "50%", 
        background: "linear-gradient(135deg, var(--color-primary-light), rgba(29, 155, 240, 0.1))",
        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)",
        marginBottom: "var(--space-6)", border: "4px solid var(--color-bg-surface)",
        boxShadow: "0 20px 40px rgba(29, 155, 240, 0.15)"
      }}>
        <MessageSquareDashed size={56} strokeWidth={1.5} />
      </div>
      
      <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "var(--space-3)", color: "var(--color-text-main)", letterSpacing: "-0.5px" }}>
        Your Messages
      </h2>
      
      <p className="text-muted" style={{ maxWidth: "380px", fontSize: "1.15rem", lineHeight: "1.6", marginBottom: "var(--space-8)" }}>
        Connect with friends, share updates, and start new conversations in real-time.
      </p>

      <button style={{
        padding: "14px 32px", borderRadius: "var(--radius-full)", background: "var(--color-primary)",
        color: "white", fontSize: "1.1rem", fontWeight: 700, border: "none", cursor: "pointer",
        boxShadow: "0 8px 24px rgba(29, 155, 240, 0.3)", transition: "transform 0.2s, box-shadow 0.2s"
      }} className="hover-scale" onClick={() => {
        // Just a dummy button that tells user to use the + button
        alert("Click the '+' button in the sidebar to search for someone!");
      }}>
        Start a new chat
      </button>
    </div>
  );
}
