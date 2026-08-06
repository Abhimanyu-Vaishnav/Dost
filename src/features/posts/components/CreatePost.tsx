"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Image as ImageIcon, Video, Link as LinkIcon, X, Loader2, 
  Smile, Calendar, MapPin, ListFilter, FileType,
  Globe, Users, Lock, Plus, ChevronDown, FileText,
  Bold, Italic, Code, Hash, Trash2, Clock
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
const PRESET_LOCATIONS = ["Mumbai, India", "Delhi, India", "Bengaluru, India", "London, UK", "New York, USA", "San Francisco, CA"];

export function CreatePost({ userName, userAvatar, initialDraft, onPostSuccess, onDraftChange, isModal = false }: CreatePostProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

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
  
  const [showEmojis, setShowEmojis] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Feature States
  const [location, setLocation] = useState<string | null>(null);
  const [showLocationUI, setShowLocationUI] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState("");

  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [showScheduleUI, setShowScheduleUI] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");

  const [pollData, setPollData] = useState<{ question: string; options: string[]; durationHours: number } | null>(null);
  const [showPollUI, setShowPollUI] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState<number>(24);

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
    const hasContent = threadItems.some(i => i.content.trim() || i.imageUrl || i.videoUrl) || !!pollData;
    if (onDraftChange) {
      onDraftChange(hasContent, threadItems);
    }
  }, [threadItems, pollData, onDraftChange]);

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

  // Text Formatting Helper (Bold, Italic, Code, Hashtag)
  const applyTextFormat = (prefix: string, suffix: string = "") => {
    const activeItem = threadItems[activeItemIndex] || threadItems[0];
    const currentId = isModal ? activeItem.id : "inline";
    const el = textareaRefs.current[currentId] || textareaRefs.current["inline"] || textareaRefs.current[activeItem.id];
    
    const currentText = activeItem.content || "";
    const start = el ? el.selectionStart : currentText.length;
    const end = el ? el.selectionEnd : currentText.length;
    
    const selected = currentText.substring(start, end);
    const placeholder = selected || (prefix === "#" ? "hashtag" : "text");
    const replacement = `${prefix}${placeholder}${suffix}`;

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    const updated = [...threadItems];
    const targetIdx = isModal ? activeItemIndex : 0;
    updated[targetIdx].content = newText;
    setThreadItems(updated);

    if (el) {
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
      }, 0);
    }
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

  // Poll Creator Helpers
  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleSavePoll = () => {
    const validOpts = pollOptions.filter(o => o.trim().length > 0);
    if (validOpts.length < 2) {
      alert("Please enter at least 2 poll options");
      return;
    }
    setPollData({
      question: threadItems[0].content || "Poll",
      options: validOpts,
      durationHours: pollDuration,
    });
    setShowPollUI(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = threadItems.filter(item => item.content.trim() || item.imageUrl || item.videoUrl || pollData);
    if (validItems.length === 0) return;

    setIsSubmitting(true);
    try {
      for (let idx = 0; idx < validItems.length; idx++) {
        const item = validItems[idx];
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: item.content,
            imageUrl: item.imageUrl,
            videoUrl: item.videoUrl,
            linkUrl: item.linkUrl,
            location: idx === 0 ? location : null,
            pollData: idx === 0 && pollData ? {
              question: item.content || "Poll",
              options: pollData.options.map((text, i) => ({ id: i + 1, text, votes: [] })),
              expiresAt: new Date(Date.now() + pollData.durationHours * 3600 * 1000).toISOString()
            } : null,
            scheduledAt: idx === 0 && scheduledAt ? scheduledAt : null,
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
      setPollData(null);
      setLocation(null);
      setScheduledAt(null);
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
  const hasContent = threadItems.some(i => i.content.trim() || i.imageUrl || i.videoUrl) || !!pollData;

  // Shared Toolbar Controls
  const renderToolbar = () => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
      {/* Icon Buttons */}
      <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="hover-bg-circle" style={{ width: "36px", height: "36px", color: "var(--color-primary)" }} title="Media">
          <ImageIcon size={19} />
        </button>
        <button type="button" onClick={() => setShowPollUI(!showPollUI)} className="hover-bg-circle" style={{ width: "36px", height: "36px", color: "var(--color-primary)" }} title="Poll">
          <ListFilter size={19} />
        </button>
        <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="hover-bg-circle" style={{ width: "36px", height: "36px", color: "var(--color-primary)" }} title="Emoji">
          <Smile size={19} />
        </button>
        <button type="button" onClick={() => setShowScheduleUI(!showScheduleUI)} className="hover-bg-circle" style={{ width: "36px", height: "36px", color: "var(--color-primary)" }} title="Schedule">
          <Calendar size={19} />
        </button>
        <button type="button" onClick={() => setShowLocationUI(!showLocationUI)} className="hover-bg-circle" style={{ width: "36px", height: "36px", color: "var(--color-primary)" }} title="Location">
          <MapPin size={19} />
        </button>

        <div style={{ width: "1px", height: "20px", background: "var(--color-border)", margin: "0 4px" }} />

        {/* Rich Formatting */}
        <button type="button" onClick={() => applyTextFormat("**", "**")} className="hover-bg-circle" style={{ width: "32px", height: "32px", color: "var(--color-text-muted)" }} title="Bold">
          <Bold size={15} />
        </button>
        <button type="button" onClick={() => applyTextFormat("*", "*")} className="hover-bg-circle" style={{ width: "32px", height: "32px", color: "var(--color-text-muted)" }} title="Italic">
          <Italic size={15} />
        </button>
        <button type="button" onClick={() => applyTextFormat("`", "`")} className="hover-bg-circle" style={{ width: "32px", height: "32px", color: "var(--color-text-muted)" }} title="Code">
          <Code size={15} />
        </button>
        <button type="button" onClick={() => applyTextFormat("#")} className="hover-bg-circle" style={{ width: "32px", height: "32px", color: "var(--color-text-muted)" }} title="Hashtag">
          <Hash size={15} />
        </button>
      </div>

      {/* Action Buttons Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {charCount > 0 && (
          <div style={{ position: "relative", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-border)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="100, 100" strokeDashoffset={strokeDashoffset} />
            </svg>
          </div>
        )}

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
          title="Add thread post"
        >
          <Plus size={16} />
        </button>

        <button
          type="submit"
          disabled={isSubmitting || uploading || !hasContent}
          style={{
            backgroundColor: hasContent ? "var(--color-primary)" : "var(--color-border)",
            color: hasContent ? "white" : "var(--color-text-muted)",
            padding: "7px 20px", borderRadius: "9999px",
            fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: hasContent ? "pointer" : "default",
            opacity: (isSubmitting || uploading || !hasContent) ? 0.6 : 1,
            transition: "all 0.15s ease"
          }}
        >
          {isSubmitting || uploading ? <Loader2 size={16} className="animate-spin" /> : threadItems.length > 1 ? "Post all" : "Post"}
        </button>
      </div>
    </div>
  );

  // Popups & Active Badges Container
  const renderBadgesAndPopups = () => (
    <>
      {/* Active Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingLeft: "52px", marginBottom: "6px" }}>
        {location && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(29, 155, 240, 0.12)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 600 }}>
            <MapPin size={13} /> {location}
            <button type="button" onClick={() => setLocation(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 0 }}><X size={12} /></button>
          </div>
        )}
        {scheduledAt && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(29, 155, 240, 0.12)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 600 }}>
            <Clock size={13} /> Scheduled: {new Date(scheduledAt).toLocaleString()}
            <button type="button" onClick={() => setScheduledAt(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 0 }}><X size={12} /></button>
          </div>
        )}
        {pollData && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(29, 155, 240, 0.12)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 600 }}>
            <ListFilter size={13} /> Poll ({pollData.options.length} options)
            <button type="button" onClick={() => setPollData(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 0 }}><X size={12} /></button>
          </div>
        )}
      </div>

      {/* Location Picker Popup */}
      {showLocationUI && (
        <div style={{ paddingLeft: "52px", marginBottom: "10px" }}>
          <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>Select Location</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {PRESET_LOCATIONS.map(loc => (
                <button key={loc} type="button" onClick={() => { setLocation(loc); setShowLocationUI(false); }} style={{ padding: "4px 10px", borderRadius: "9999px", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-main)", fontSize: "0.8rem", cursor: "pointer" }}>
                  {loc}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" placeholder="Custom location..." value={customLocationInput} onChange={e => setCustomLocationInput(e.target.value)} style={{ flex: 1, padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-main)", fontSize: "0.85rem" }} />
              <button type="button" onClick={() => { if (customLocationInput.trim()) { setLocation(customLocationInput.trim()); setCustomLocationInput(""); setShowLocationUI(false); } }} style={{ padding: "6px 14px", borderRadius: "8px", background: "var(--color-primary)", color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "0.85rem" }}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Picker Popup */}
      {showScheduleUI && (
        <div style={{ paddingLeft: "52px", marginBottom: "10px" }}>
          <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>Schedule Post</span>
            <input type="datetime-local" value={scheduleDateTime} onChange={e => setScheduleDateTime(e.target.value)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-main)", fontSize: "0.9rem" }} />
            <button type="button" onClick={() => { if (scheduleDateTime) { setScheduledAt(scheduleDateTime); setShowScheduleUI(false); } }} style={{ padding: "8px", borderRadius: "8px", background: "var(--color-primary)", color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "0.85rem" }}>
              Set Schedule
            </button>
          </div>
        </div>
      )}

      {/* Poll Creator Popup */}
      {showPollUI && (
        <div style={{ paddingLeft: "52px", marginBottom: "10px" }}>
          <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>Create Poll</span>
            {pollOptions.map((opt, i) => (
              <input key={i} type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const updated = [...pollOptions]; updated[i] = e.target.value; setPollOptions(updated); }} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-main)", fontSize: "0.9rem" }} />
            ))}
            {pollOptions.length < 4 && (
              <button type="button" onClick={handleAddPollOption} style={{ color: "var(--color-primary)", background: "none", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", textAlign: "left" }}>
                + Add Option
              </button>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <select value={pollDuration} onChange={e => setPollDuration(Number(e.target.value))} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-main)", fontSize: "0.85rem" }}>
                <option value={24}>1 Day</option>
                <option value={72}>3 Days</option>
                <option value={168}>7 Days</option>
              </select>
              <button type="button" onClick={handleSavePoll} style={{ padding: "6px 16px", borderRadius: "9999px", background: "var(--color-primary)", color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "0.85rem" }}>
                Save Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Row */}
      {showEmojis && (
        <div style={{ paddingLeft: "52px", marginBottom: "10px", display: "flex", gap: "6px", flexWrap: "wrap", background: "var(--color-bg-surface)", padding: "8px 12px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          {EMOJIS.map(emoji => (
            <button key={emoji} type="button" onClick={() => { const updated = [...threadItems]; updated[activeItemIndex].content += emoji; setThreadItems(updated); setShowEmojis(false); }} style={{ fontSize: "1.2rem", background: "none", border: "none", cursor: "pointer" }}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );

  // Inline Feed Mode
  if (!isModal && showThreadModal) {
    return (
      <>
        <CreatePostModal userName={userName} userAvatar={userAvatar} initialDraft={initialModalDraft} autoOpenDrafts={autoOpenDrafts} onClose={() => setShowThreadModal(false)} />
        {renderInlineForm()}
      </>
    );
  }

  function renderInlineForm() {
    return (
      <form onSubmit={handleSubmit} style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px", background: "transparent", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--color-bg-surface)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
            {userAvatar ? <img src={userAvatar} alt="Me" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : userName.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Audience Visibility Pill */}
            <div style={{ position: "relative", width: "fit-content" }}>
              <button
                type="button"
                onClick={() => setShowAudienceMenu(!showAudienceMenu)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "2px 10px", borderRadius: "9999px",
                  border: "1px solid var(--color-primary)", color: "var(--color-primary)",
                  background: "rgba(29, 155, 240, 0.08)", fontSize: "0.8rem", fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {replyAudience === "EVERYONE" && <><Globe size={13} /> Everyone can reply</>}
                {replyAudience === "FOLLOWERS" && <><Users size={13} /> People you follow</>}
                {replyAudience === "MENTIONED" && <><Lock size={13} /> Only people you mention</>}
                <ChevronDown size={13} />
              </button>

              {showAudienceMenu && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, zIndex: 100, marginTop: "4px",
                  background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
                  borderRadius: "14px", padding: "6px", display: "flex", flexDirection: "column", gap: "2px",
                  boxShadow: "var(--shadow-lg)", minWidth: "220px"
                }}>
                  <div style={{ padding: "6px 10px", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Who can reply?</div>
                  <button
                    type="button"
                    onClick={() => { setReplyAudience("EVERYONE"); setShowAudienceMenu(false); }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", background: replyAudience === "EVERYONE" ? "rgba(29,155,240,0.1)" : "transparent", color: "var(--color-text-main)", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                  >
                    <Globe size={16} style={{ color: "var(--color-primary)" }} /> Everyone
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReplyAudience("FOLLOWERS"); setShowAudienceMenu(false); }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", background: replyAudience === "FOLLOWERS" ? "rgba(29,155,240,0.1)" : "transparent", color: "var(--color-text-main)", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                  >
                    <Users size={16} style={{ color: "var(--color-primary)" }} /> Accounts you follow
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReplyAudience("MENTIONED"); setShowAudienceMenu(false); }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", background: replyAudience === "MENTIONED" ? "rgba(29,155,240,0.1)" : "transparent", color: "var(--color-text-main)", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                  >
                    <Lock size={16} style={{ color: "var(--color-primary)" }} /> Only accounts you mention
                  </button>
                </div>
              )}
            </div>

            <textarea
              rows={1}
              value={threadItems[0].content}
              ref={(el) => { textareaRefs.current["inline"] = el; }}
              onChange={(e) => handleTextareaInput(0, e.target.value, e.target)}
              placeholder="What is happening?!"
              disabled={isSubmitting}
              style={{ width: "100%", border: "none", resize: "none", backgroundColor: "transparent", color: "var(--color-text-main)", fontSize: "1.1rem", outline: "none", overflow: "hidden", minHeight: "44px", paddingTop: "4px", fontWeight: 400, fontFamily: "inherit", lineHeight: "1.4" }}
            />
          </div>

          <button type="button" onClick={handleOpenDraftsClick} style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", padding: "4px 10px", borderRadius: "9999px", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }} className="hover-bg">
            <FileText size={15} /> Drafts {draftsCount > 0 && `(${draftsCount})`}
          </button>
        </div>

        {/* Media Preview */}
        {(threadItems[0].imageUrl || threadItems[0].videoUrl) && (
          <div style={{ marginTop: "6px", borderRadius: "16px", position: "relative", overflow: "hidden", border: "1px solid var(--color-border)", marginLeft: "52px" }}>
            <button type="button" onClick={() => { const updated = [...threadItems]; updated[0].imageUrl = ""; updated[0].videoUrl = ""; setThreadItems(updated); }} style={{ position: "absolute", right: "10px", top: "10px", color: "white", background: "rgba(0, 0, 0, 0.7)", borderRadius: "50%", padding: "5px", zIndex: 2, cursor: "pointer", border: "none" }}>
              <X size={15} />
            </button>
            {threadItems[0].imageUrl && <img src={threadItems[0].imageUrl} style={{ width: "100%", maxHeight: "320px", objectFit: "cover" }} alt="Preview" />}
            {threadItems[0].videoUrl && <video src={threadItems[0].videoUrl} controls style={{ width: "100%", maxHeight: "320px" }} />}
          </div>
        )}

        {renderBadgesAndPopups()}
        {renderToolbar()}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: "none" }} />
      </form>
    );
  }

  if (!isModal) {
    return renderInlineForm();
  }

  // MODAL MODE
  return (
    <form onSubmit={handleSubmit} style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px", background: "transparent" }}>
      <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
        {threadItems.map((item, idx) => {
          const isLast = idx === threadItems.length - 1;
          const isActive = idx === activeItemIndex;

          return (
            <div key={item.id} onClick={() => setActiveItemIndex(idx)} style={{ display: "flex", gap: "12px", position: "relative", opacity: isActive ? 1 : 0.6, transition: "opacity 0.15s ease", cursor: isActive ? "default" : "pointer" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "40px", flexShrink: 0 }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--color-bg-surface)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", overflow: "hidden", zIndex: 2, border: isActive ? "2px solid var(--color-primary)" : "1px solid var(--color-border)" }}>
                  {userAvatar ? <img src={userAvatar} alt="Me" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : userName.charAt(0).toUpperCase()}
                </div>
                {!isLast && <div style={{ width: "2px", background: "var(--color-border)", flex: 1, minHeight: "32px", margin: "4px 0", zIndex: 1 }} />}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: !isLast ? "16px" : "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <textarea
                    rows={1}
                    value={item.content}
                    ref={(el) => { textareaRefs.current[item.id] = el; }}
                    onFocus={() => setActiveItemIndex(idx)}
                    onChange={(e) => handleTextareaInput(idx, e.target.value, e.target)}
                    placeholder={idx === 0 ? "What is happening?!" : "Add another post"}
                    disabled={isSubmitting}
                    style={{ width: "100%", border: "none", resize: "none", backgroundColor: "transparent", color: "var(--color-text-main)", fontSize: "1.1rem", outline: "none", overflow: "hidden", minHeight: "40px", paddingTop: "6px", fontWeight: 400, fontFamily: "inherit", lineHeight: "1.4" }}
                  />
                  {threadItems.length > 1 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeThreadItem(idx); }} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {(item.imageUrl || item.videoUrl) && (
                  <div style={{ marginTop: "6px", borderRadius: "16px", position: "relative", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                    <button type="button" onClick={() => { const updated = [...threadItems]; updated[idx].imageUrl = ""; updated[idx].videoUrl = ""; setThreadItems(updated); }} style={{ position: "absolute", right: "8px", top: "8px", color: "white", background: "rgba(0, 0, 0, 0.7)", borderRadius: "50%", padding: "4px", zIndex: 2, cursor: "pointer", border: "none" }}>
                      <X size={14} />
                    </button>
                    {item.imageUrl && <img src={item.imageUrl} style={{ width: "100%", maxHeight: "280px", objectFit: "cover" }} alt="Preview" />}
                    {item.videoUrl && <video src={item.videoUrl} controls style={{ width: "100%", maxHeight: "280px" }} />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {renderBadgesAndPopups()}
      {renderToolbar()}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: "none" }} />
    </form>
  );
}
