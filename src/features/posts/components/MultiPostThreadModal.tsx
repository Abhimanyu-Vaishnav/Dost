"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Image, Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DraftPost {
  id: string;
  content: string;
  imageUrl?: string | null;
}

interface MultiPostThreadModalProps {
  onClose: () => void;
  userName: string;
  userAvatar?: string | null;
}

export function MultiPostThreadModal({ onClose, userName, userAvatar }: MultiPostThreadModalProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftPost[]>([
    { id: "1", content: "" },
    { id: "2", content: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDraft = () => {
    setDrafts((prev) => [...prev, { id: Date.now().toString(), content: "" }]);
  };

  const removeDraft = (id: string) => {
    if (drafts.length <= 1) return;
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const updateContent = (id: string, text: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, content: text } : d)));
  };

  const handlePostThread = async (e: React.FormEvent) => {
    e.preventDefault();

    const validDrafts = drafts.filter((d) => d.content.trim().length > 0 || d.imageUrl);
    if (validDrafts.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadPosts: validDrafts.map((d) => ({
            content: d.content,
            imageUrl: d.imageUrl || null,
          })),
        }),
      });

      if (res.ok) {
        onClose();
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to publish thread");
      }
    } catch (err: any) {
      console.error("Publish thread error:", err);
      setError("Network error while publishing thread");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasContent = drafts.some((d) => d.content.trim().length > 0);

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="glass animate-scale-in"
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          backgroundColor: "var(--color-bg-base)",
          borderRadius: "20px",
          border: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-text-main)",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} />
            </button>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-text-main)" }}>
              Create Thread
            </span>
          </div>

          <button
            onClick={handlePostThread}
            disabled={!hasContent || isSubmitting}
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              background: hasContent ? "var(--color-primary)" : "rgba(29, 155, 240, 0.4)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: hasContent ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
            }}
          >
            {isSubmitting ? "Posting..." : `Post All (${drafts.length})`}
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 20px",
              background: "rgba(255, 77, 77, 0.1)",
              color: "#ff4d4d",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* Thread Posts List */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
          {drafts.map((draft, index) => {
            const isLast = index === drafts.length - 1;

            return (
              <div key={draft.id} style={{ display: "flex", gap: "14px", position: "relative" }}>
                {/* Avatar Column & 2px Vertical Line Connector */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-primary)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      userName.charAt(0).toUpperCase()
                    )}
                  </div>

                  {!isLast && (
                    <div
                      style={{
                        width: "2px",
                        flex: 1,
                        backgroundColor: "var(--color-border)",
                        margin: "6px 0",
                        minHeight: "40px",
                      }}
                    />
                  )}
                </div>

                {/* Content Input Area */}
                <div style={{ flex: 1, paddingBottom: isLast ? "0" : "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-primary)" }}>
                      Post {index + 1} of thread
                    </span>
                    {drafts.length > 1 && (
                      <button
                        onClick={() => removeDraft(draft.id)}
                        style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", padding: "4px" }}
                        title="Remove post from thread"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <textarea
                    value={draft.content}
                    onChange={(e) => updateContent(draft.id, e.target.value)}
                    placeholder={index === 0 ? "What is happening?!" : "Add another post..."}
                    rows={3}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: "var(--color-text-main)",
                      fontSize: "1rem",
                      outline: "none",
                      resize: "none",
                      fontFamily: "inherit",
                      lineHeight: "1.4",
                    }}
                    autoFocus={index === drafts.length - 1}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          <button
            onClick={addDraft}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(29, 155, 240, 0.1)",
              color: "var(--color-primary)",
              border: "none",
              padding: "8px 16px",
              borderRadius: "9999px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={16} />
            <span>Add to thread</span>
          </button>
        </div>
      </div>
    </div>
  );
}
