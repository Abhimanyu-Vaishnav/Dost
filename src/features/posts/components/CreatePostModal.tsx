"use client";

import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { CreatePost } from "./CreatePost";

interface CreatePostModalProps {
  onClose: () => void;
  userName?: string;
  userAvatar?: string | null;
  initialDraft?: string;
  autoOpenDrafts?: boolean;
}

interface SavedDraft {
  id: string;
  createdAt: string;
  threadItems: { content: string; imageUrl?: string; videoUrl?: string }[];
}

export function CreatePostModal({ onClose, userName, userAvatar, initialDraft, autoOpenDrafts = false }: CreatePostModalProps) {
  const [hasContent, setHasContent] = useState(false);
  const [currentThreads, setCurrentThreads] = useState<any[]>([]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showDraftsList, setShowDraftsList] = useState(autoOpenDrafts);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [activeDraftText, setActiveDraftText] = useState<string | undefined>(initialDraft);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dost_saved_drafts");
      if (stored) {
        setSavedDrafts(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const handleCloseAttempt = () => {
    if (hasContent) {
      setShowSavePrompt(true);
    } else {
      onClose();
    }
  };

  const handleSaveDraft = () => {
    const validItems = currentThreads.filter(i => i.content.trim() || i.imageUrl || i.videoUrl);
    if (validItems.length > 0) {
      // Remove previously selected draft ID if re-saving
      const filtered = selectedDraftId ? savedDrafts.filter(d => d.id !== selectedDraftId) : savedDrafts;
      const newDraft: SavedDraft = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        threadItems: validItems,
      };
      const updated = [newDraft, ...filtered];
      setSavedDrafts(updated);
      localStorage.setItem("dost_saved_drafts", JSON.stringify(updated));
    }
    setShowSavePrompt(false);
    onClose();
  };

  const handleDiscardDraft = () => {
    setShowSavePrompt(false);
    onClose();
  };

  const handleDeleteSavedDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDrafts.filter(d => d.id !== id);
    setSavedDrafts(updated);
    localStorage.setItem("dost_saved_drafts", JSON.stringify(updated));
    if (selectedDraftId === id) {
      setSelectedDraftId(null);
    }
  };

  const handleSelectDraft = (draft: SavedDraft) => {
    const mainText = draft.threadItems.map(i => i.content).join("\n---\n");
    setActiveDraftText(mainText);
    setSelectedDraftId(draft.id);
    setShowDraftsList(false);
  };

  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)", display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 1200, backdropFilter: "blur(8px)", padding: "0"
      }} 
      onClick={handleCloseAttempt}
    >
      <div 
        className="glass animate-slide-up" 
        style={{
          width: "100%", maxWidth: "600px", height: "100%", maxHeight: "100vh",
          borderRadius: "0", display: "flex", flexDirection: "column",
          border: "none", background: "var(--color-bg-base)",
          margin: 0, boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5)",
          overflow: "hidden", position: "relative"
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Row: ✕ Close Icon on Left, Drafts on Right */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px"
        }}>
          <button
            onClick={handleCloseAttempt}
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
            onClick={() => setShowDraftsList(!showDraftsList)}
            style={{
              background: "none", border: "none", color: "var(--color-primary)",
              fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", padding: "4px 8px"
            }}
            className="hover-bg"
          >
            Drafts ({savedDrafts.length})
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <CreatePost 
            key={activeDraftText || "default"}
            userName={userName || "User"} 
            userAvatar={userAvatar}
            initialDraft={activeDraftText}
            isModal={true}
            onDraftChange={(contentExists, threads) => {
              setHasContent(contentExists);
              setCurrentThreads(threads);
            }}
            onPostSuccess={() => {
              // Delete the draft from localStorage after successful posting
              if (selectedDraftId) {
                const updated = savedDrafts.filter(d => d.id !== selectedDraftId);
                setSavedDrafts(updated);
                localStorage.setItem("dost_saved_drafts", JSON.stringify(updated));
              } else if (activeDraftText) {
                const updated = savedDrafts.filter(d => {
                  const dText = d.threadItems.map(i => i.content).join("\n---\n");
                  return dText !== activeDraftText;
                });
                setSavedDrafts(updated);
                localStorage.setItem("dost_saved_drafts", JSON.stringify(updated));
              }
              onClose();
            }} 
          />
        </div>

        {/* Save Draft Confirmation Prompt Overlay */}
        {showSavePrompt && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 200,
            background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
          }}>
            <div className="glass animate-scale-in" style={{
              background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
              borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "340px",
              display: "flex", flexDirection: "column", gap: "16px", textOverflow: "ellipsis"
            }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "4px" }}>Save post?</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: 0 }}>You can save this to finish it later.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={handleSaveDraft}
                  style={{
                    background: "var(--color-text-main)", color: "var(--color-bg-base)",
                    padding: "12px", borderRadius: "99px", fontWeight: 800, fontSize: "0.95rem",
                    cursor: "pointer", border: "none"
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleDiscardDraft}
                  style={{
                    background: "none", border: "1px solid var(--color-border)",
                    color: "#ff4d4d", padding: "12px", borderRadius: "99px",
                    fontWeight: 800, fontSize: "0.95rem", cursor: "pointer"
                  }}
                >
                  Discard
                </button>
                <button
                  onClick={() => setShowSavePrompt(false)}
                  style={{
                    background: "none", border: "none", color: "var(--color-text-muted)",
                    padding: "8px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drafts Manager List Modal */}
        {showDraftsList && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 150,
            background: "var(--color-bg-base)", display: "flex",
            flexDirection: "column", overflow: "hidden"
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px", borderBottom: "1px solid var(--color-border)"
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)" }}>Unsent Posts</h3>
              <button onClick={() => setShowDraftsList(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {savedDrafts.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No saved drafts found.
                </div>
              ) : (
                savedDrafts.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDraft(d)}
                    className="glass hover-bg"
                    style={{
                      padding: "16px", borderRadius: "16px", border: "1px solid var(--color-border)",
                      display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflow: "hidden" }}>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.threadItems[0]?.content || "Untitled Media Draft"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {new Date(d.createdAt).toLocaleDateString()} • {d.threadItems.length} post(s)
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSavedDraft(d.id, e)}
                      style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "8px" }}
                      className="hover-bg-circle"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
