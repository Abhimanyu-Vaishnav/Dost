"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Image as ImageIcon, Video, Link as LinkIcon, X, Loader2, 
  Smile, Calendar, MapPin, ListFilter, FileType,
  Globe, Users, Lock, Plus, ChevronDown, FileText
} from "lucide-react";
import { uploadMediaFile } from "@/lib/upload";
import { CreatePostModal } from "./CreatePostModal";

interface CreatePostProps {
  userName: string;
  userAvatar?: string | null;
  initialDraft?: string;
  onPostSuccess?: () => void;
  onDraftChange?: (hasContent: boolean, threadItems: ThreadItem[]) => void;
  isModal?: boolean;
}

interface ThreadItem {
  id: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
}

const EMOJIS = ["😀", "😂", "😍", "🔥", "✨", "👏", "💯", "🙏", "❤️", "🚀", "💡", "🎉", "👀", "🥳", "👍"];

export function CreatePost({ userName, userAvatar, initialDraft, onPostSuccess, onDraftChange, isModal = false }: CreatePostProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // If inline, state to launch modal pop-up when adding thread or opening drafts
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [autoOpenDrafts, setAutoOpenDrafts] = useState(false);
  const [initialModalDraft, setInitialModalDraft] = useState("");
  const [draftsCount, setDraftsCount] = useState(0);

  const [threadItems, setThreadItems] = useState<ThreadItem[]>(() => {
    if (initialDraft && initialDraft.trim()) {
      return [
        { id: "1", content: initialDraft },
        { id: "2", content: "" }
      ];
    }
    return [{ id: "1", content: "" }];
  });
  const [activeItemIndex, setActiveItemIndex] = useState(initialDraft && initialDraft.trim() ? 1 : 0);

  const [replyAudience, setReplyAudience] = useState<"EVERYONE" | "FOLLOWERS" | "MENTIONED">("EVERYONE");
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  
  const [showMediaInput, setShowMediaInput] = useState<"link" | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dost_saved_drafts");
      if (stored) {
        const arr = JSON.parse(stored);
        setDraftsCount(arr.length);
      }
    } catch (e) {}
  }, [showThreadModal]);

  useEffect(() => {
    const hasContent = threadItems.some(i => i.content.trim() || i.imageUrl || i.videoUrl);
    if (onDraftChange) {
      onDraftChange(hasContent, threadItems);
    }
  }, [threadItems, onDraftChange]);

  // Resize textareas safely without triggering parent scroll jump
  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(40, el.scrollHeight)}px`;
  };

  useLayoutEffect(() => {
    Object.values(textareaRefs.current).forEach(el => resizeTextarea(el));
  }, [threadItems]);

  const handleTextareaInput = (index: number, val: string, target: HTMLTextAreaElement) => {
    const updated = [...threadItems];
    updated[index].content = val;
    setThreadItems(updated);
    resizeTextarea(target);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedUrl = await uploadMediaFile(file);
      const updated = [...threadItems];
      if (file.type.startsWith("image/")) {
        updated[activeItemIndex].imageUrl = uploadedUrl;
      } else if (file.type.startsWith("video/")) {
        updated[activeItemIndex].videoUrl = uploadedUrl;
      }
      setThreadItems(updated);
      setShowMediaInput(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleAddThreadClick = () => {
    if (!isModal) {
      setInitialModalDraft(threadItems[0]?.content || "");
      setAutoOpenDrafts(false);
      setShowThreadModal(true);
      return;
    }

    const newItem: ThreadItem = {
      id: Date.now().toString(),
      content: "",
      imageUrl: "",
      videoUrl: "",
      linkUrl: "",
    };
    setThreadItems([...threadItems, newItem]);
    setActiveItemIndex(threadItems.length);
  };

  const handleOpenDraftsClick = () => {
    if (!isModal) {
      setInitialModalDraft("");
      setAutoOpenDrafts(true);
      setShowThreadModal(true);
    }
  };

  const removeThreadItem = (index: number) => {
    if (threadItems.length <= 1) return;
    const updated = threadItems.filter((_, i) => i !== index);
    setThreadItems(updated);
    setActiveItemIndex(Math.max(0, index - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = threadItems.filter(item => item.content.trim() || item.imageUrl || item.videoUrl);
    if (validItems.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const item of validItems) {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: item.content,
            imageUrl: item.imageUrl,
            videoUrl: item.videoUrl,
            linkUrl: item.linkUrl,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Failed to create post");
          setIsSubmitting(false);
          return;
        }
      }

      setThreadItems([{ id: "1", content: "", imageUrl: "", videoUrl: "", linkUrl: "" }]);
      setShowMediaInput(null);
      router.refresh();
      if (onPostSuccess) onPostSuccess();
    } catch (error) {
      console.error(error);
      alert("Error posting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentItem = threadItems[activeItemIndex] || threadItems[0];
  const charCount = currentItem.content.length;
  const maxChars = 280;
  const charPercentage = Math.min(100, (charCount / maxChars) * 100);
  const strokeDashoffset = 100 - charPercentage;
  const hasContent = threadItems.some(i => i.content.trim() || i.imageUrl || i.videoUrl);

  // Inline Feed Form Mode
  if (!isModal && showThreadModal) {
    return (
      <>
        <CreatePostModal
          userName={userName}
          userAvatar={userAvatar}
          initialDraft={initialModalDraft}
          autoOpenDrafts={autoOpenDrafts}
          onClose={() => setShowThreadModal(false)}
        />
        {renderInlineForm()}
      </>
    );
  }

  function renderInlineForm() {
    return (
      <form onSubmit={handleSubmit} style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "transparent",
        borderBottom: "1px solid var(--color-border)"
      }}>
        {/* Top Header Row with Drafts Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "12px", flex: 1, alignItems: "center" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              backgroundColor: "var(--color-primary)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
              fontSize: "1.1rem", overflow: "hidden", flexShrink: 0
            }}>
              {userAvatar ? (
                <img src={userAvatar} alt="Me" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>

            <textarea
              rows={1}
              value={threadItems[0].content}
              ref={(el) => { textareaRefs.current["inline"] = el; }}
              onChange={(e) => handleTextareaInput(0, e.target.value, e.target)}
              placeholder="What is happening?!"
              disabled={isSubmitting}
              style={{
                width: "100%", border: "none", resize: "none", backgroundColor: "transparent",
                color: "var(--color-text-main)", fontSize: "1.2rem", outline: "none",
                overflow: "hidden", minHeight: "44px", paddingTop: "6px", fontWeight: 400,
                fontFamily: "inherit", lineHeight: "1.5"
              }}
            />
          </div>

          {/* Drafts Button on Inline Form */}
          <button
            type="button"
            onClick={handleOpenDraftsClick}
            style={{
              background: "none", border: "none", color: "var(--color-primary)",
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", padding: "4px 10px",
              borderRadius: "99px", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0
            }}
            className="hover-bg"
            title="View saved drafts"
          >
            <FileText size={16} /> Drafts {draftsCount > 0 && `(${draftsCount})`}
          </button>
        </div>

        {/* Media Previews */}
        {(threadItems[0].imageUrl || threadItems[0].videoUrl || threadItems[0].linkUrl) && (
          <div className="animate-slide-up" style={{ marginTop: "10px", borderRadius: "16px", position: "relative", overflow: "hidden", border: "1px solid var(--color-border)", marginLeft: "52px" }}>
            <button
              type="button"
              onClick={() => {
                const updated = [...threadItems];
                updated[0].imageUrl = "";
                updated[0].videoUrl = "";
                updated[0].linkUrl = "";
                setThreadItems(updated);
              }}
              style={{ position: "absolute", right: "12px", top: "12px", color: "white", background: "rgba(15, 20, 25, 0.75)", borderRadius: "50%", padding: "6px", zIndex: 2, cursor: "pointer" }}
            >
              <X size={16} />
            </button>
            {threadItems[0].imageUrl && <img src={threadItems[0].imageUrl} style={{ width: "100%", maxHeight: "350px", objectFit: "cover" }} alt="Preview" />}
            {threadItems[0].videoUrl && <video src={threadItems[0].videoUrl} controls style={{ width: "100%", maxHeight: "350px" }} />}
          </div>
        )}

        {/* Global Audience Indicator */}
        <div style={{ paddingLeft: "52px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)", fontSize: "0.85rem", fontWeight: 700 }}>
          <Globe size={16} />
          <span>Everyone can reply</span>
        </div>

        <div style={{ height: "1px", background: "var(--color-border)" }} />

        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Upload Media">
              <ImageIcon size={20} />
            </button>
            <button type="button" onClick={() => alert("GIF coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="GIF">
              <FileType size={20} />
            </button>
            <button type="button" onClick={() => alert("Poll coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Poll">
              <ListFilter size={20} />
            </button>
            <button type="button" onClick={() => setShowEmojis(!showEmojis)} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Add Emoji">
              <Smile size={20} />
            </button>
            <button type="button" onClick={() => alert("Schedule coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Schedule">
              <Calendar size={20} />
            </button>
            <button type="button" onClick={() => alert("Location coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Location">
              <MapPin size={20} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Circular Ring */}
            {charCount > 0 && (
              <div style={{ position: "relative", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="100, 100" strokeDashoffset={strokeDashoffset} />
                </svg>
              </div>
            )}

            {/* Add Thread (+) Button launching Modal Popup */}
            <button
              type="button"
              onClick={handleAddThreadClick}
              style={{
                width: "32px", height: "32px", borderRadius: "50%",
                border: "1px solid var(--color-primary)", color: "var(--color-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", background: "none"
              }}
              className="hover-bg"
              title="Add thread (Opens pop-up)"
            >
              <Plus size={18} />
            </button>

            {/* Post Button */}
            <button
              type="submit"
              disabled={isSubmitting || uploading || !hasContent}
              style={{
                backgroundColor: hasContent ? "var(--color-primary)" : "var(--color-border)",
                color: hasContent ? "white" : "var(--color-text-muted)",
                padding: "8px 22px", borderRadius: "99px",
                fontWeight: 800, fontSize: "0.95rem", border: "none", cursor: hasContent ? "pointer" : "default",
                opacity: (isSubmitting || uploading || !hasContent) ? 0.6 : 1,
                transition: "all 0.2s"
              }}
            >
              {isSubmitting || uploading ? <Loader2 size={18} className="animate-spin" /> : "Post"}
            </button>
          </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: "none" }} />
      </form>
    );
  }

  if (!isModal) {
    return renderInlineForm();
  }

  // MODAL MODE
  return (
    <form onSubmit={handleSubmit} style={{
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      background: "transparent",
    }}>
      {/* Thread Items Chain */}
      <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
        {threadItems.map((item, idx) => {
          const isLast = idx === threadItems.length - 1;
          const isActive = idx === activeItemIndex;

          return (
            <div 
              key={item.id} 
              onClick={() => setActiveItemIndex(idx)}
              style={{ 
                display: "flex", gap: "14px", position: "relative",
                opacity: isActive ? 1 : 0.55,
                transition: "opacity 0.2s ease",
                cursor: isActive ? "default" : "pointer"
              }}
            >
              {/* Left Column: Avatar + Continuous Thread Line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "40px", flexShrink: 0 }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  backgroundColor: "var(--color-primary)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                  fontSize: "1.1rem", overflow: "hidden", zIndex: 2,
                  boxShadow: isActive ? "0 0 0 2px var(--color-primary)" : "none"
                }}>
                  {userAvatar ? (
                    <img src={userAvatar} alt="Me" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Connecting Line extending down */}
                {!isLast && (
                  <div style={{
                    width: "2px",
                    background: "var(--color-border)",
                    flex: 1,
                    minHeight: "36px",
                    margin: "4px 0",
                    zIndex: 1
                  }} />
                )}
              </div>

              {/* Right Column: Text Area & Delete Button */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: !isLast ? "20px" : "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <textarea
                    rows={1}
                    value={item.content}
                    ref={(el) => { textareaRefs.current[item.id] = el; }}
                    onFocus={() => setActiveItemIndex(idx)}
                    onChange={(e) => handleTextareaInput(idx, e.target.value, e.target)}
                    placeholder={idx === 0 ? "What is happening?!" : "Add another post"}
                    disabled={isSubmitting}
                    style={{
                      width: "100%", border: "none", resize: "none", backgroundColor: "transparent",
                      color: "var(--color-text-main)", fontSize: "1.2rem", outline: "none",
                      overflow: "hidden", minHeight: "40px", paddingTop: "6px", fontWeight: 400,
                      fontFamily: "inherit", lineHeight: "1.5"
                    }}
                  />
                  {threadItems.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeThreadItem(idx);
                      }}
                      style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                      title="Remove post"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Media Previews */}
                {(item.imageUrl || item.videoUrl || item.linkUrl) && (
                  <div className="animate-slide-up" style={{ marginTop: "10px", borderRadius: "16px", position: "relative", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...threadItems];
                        updated[idx].imageUrl = "";
                        updated[idx].videoUrl = "";
                        updated[idx].linkUrl = "";
                        setThreadItems(updated);
                      }}
                      style={{ position: "absolute", right: "12px", top: "12px", color: "white", background: "rgba(15, 20, 25, 0.75)", borderRadius: "50%", padding: "6px", zIndex: 2, cursor: "pointer" }}
                    >
                      <X size={16} />
                    </button>
                    {item.imageUrl && <img src={item.imageUrl} style={{ width: "100%", maxHeight: "350px", objectFit: "cover" }} alt="Preview" />}
                    {item.videoUrl && <video src={item.videoUrl} controls style={{ width: "100%", maxHeight: "350px" }} />}
                  </div>
                )}

                {/* Audience Pill ("Everyone v") on active post */}
                {isActive && idx === 0 && (
                  <div style={{ position: "relative", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setShowAudienceMenu(!showAudienceMenu)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        background: "transparent", border: "1px solid var(--color-primary)",
                        color: "var(--color-primary)", fontWeight: 700, fontSize: "0.85rem",
                        cursor: "pointer", padding: "3px 12px", borderRadius: "99px"
                      }}
                      className="hover-bg"
                    >
                      <span>
                        {replyAudience === "EVERYONE" && "Everyone"}
                        {replyAudience === "FOLLOWERS" && "Accounts you follow"}
                        {replyAudience === "MENTIONED" && "Only mentioned"}
                      </span>
                      <ChevronDown size={14} />
                    </button>

                    {showAudienceMenu && (
                      <>
                        <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setShowAudienceMenu(false)} />
                        <div className="glass animate-scale-in" style={{
                          position: "absolute", left: 0, top: "100%", zIndex: 100,
                          background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
                          borderRadius: "16px", padding: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                          display: "flex", flexDirection: "column", gap: "4px", minWidth: "240px", marginTop: "4px"
                        }}>
                          <h4 style={{ fontSize: "0.85rem", fontWeight: 800, padding: "8px 12px", color: "var(--color-text-main)" }}>Who can reply?</h4>
                          <button
                            type="button"
                            onClick={() => { setReplyAudience("EVERYONE"); setShowAudienceMenu(false); }}
                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", color: "var(--color-text-main)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
                            className="hover-bg"
                          >
                            <Globe size={18} color="var(--color-primary)" /> Everyone
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Audience Indicator Above Toolbar */}
      <div style={{ paddingLeft: "54px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)", fontSize: "0.85rem", fontWeight: 700 }}>
        <Globe size={16} />
        <span>Everyone can reply</span>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)" }} />

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Upload Media">
            <ImageIcon size={20} />
          </button>
          <button type="button" onClick={() => alert("GIF coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="GIF">
            <FileType size={20} />
          </button>
          <button type="button" onClick={() => alert("Poll coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Poll">
            <ListFilter size={20} />
          </button>
          <button type="button" onClick={() => setShowEmojis(!showEmojis)} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Add Emoji">
            <Smile size={20} />
          </button>
          <button type="button" onClick={() => alert("Schedule coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Schedule">
            <Calendar size={20} />
          </button>
          <button type="button" onClick={() => alert("Location coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Location">
            <MapPin size={20} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Circular Ring */}
          {charCount > 0 && (
            <div style={{ position: "relative", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="26" height="26" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="100, 100" strokeDashoffset={strokeDashoffset} />
              </svg>
            </div>
          )}

          {/* (+) Add Thread Button */}
          <button
            type="button"
            onClick={handleAddThreadClick}
            style={{
              width: "32px", height: "32px", borderRadius: "50%",
              border: "1px solid var(--color-primary)", color: "var(--color-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", background: "none"
            }}
            className="hover-bg"
            title="Add to thread"
          >
            <Plus size={18} />
          </button>

          {/* Post All Button */}
          <button
            type="submit"
            disabled={isSubmitting || uploading || !hasContent}
            style={{
              backgroundColor: hasContent ? "var(--color-primary)" : "var(--color-border)",
              color: hasContent ? "white" : "var(--color-text-muted)",
              padding: "8px 22px", borderRadius: "99px",
              fontWeight: 800, fontSize: "0.95rem", border: "none", cursor: hasContent ? "pointer" : "default",
              opacity: (isSubmitting || uploading || !hasContent) ? 0.6 : 1,
              transition: "all 0.2s"
            }}
          >
            {isSubmitting || uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : threadItems.length > 1 ? (
              "Post all"
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: "none" }} />
    </form>
  );
}
