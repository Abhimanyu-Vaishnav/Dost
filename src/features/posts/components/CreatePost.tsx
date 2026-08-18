"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Image as ImageIcon, Video, Link as LinkIcon, X, Loader2, 
  Smile, Calendar, MapPin, ListFilter, FileType,
  Globe, Users, Lock, Plus, ChevronDown, FileText,
  Bold, Italic, Code, Hash, Trash2, Clock, Sparkles, Mic, Square, Play, Pause, Volume2,
  UserPlus, AtSign, Tag
} from "lucide-react";
import { uploadMediaFile } from "@/lib/upload";
import { CreatePostModal } from "./CreatePostModal";
import { GifPickerModal } from "@/components/common/GifPickerModal";

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

  // Voice Note Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordTime, setVoiceRecordTime] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecordingVoice(true);
      setVoiceRecordTime(0);

      recordTimerRef.current = setInterval(() => {
        setVoiceRecordTime(prev => {
          if (prev >= 30) {
            stopVoiceRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic access error:", err);
      setRecordedAudioUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  };

  // Poll State
  const [pollData, setPollData] = useState<{ question: string; options: string[]; durationHours: number } | null>(null);
  const [showPollUI, setShowPollUI] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState<number>(24);

  // AI & GIF Picker state
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showGifModal, setShowGifModal] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiAction = async (action: string) => {
    const currentContent = threadItems[activeItemIndex]?.content || "";
    if (!currentContent.trim()) {
      alert("Please type a draft first so AI can help!");
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentContent, action })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        const updated = [...threadItems];
        updated[activeItemIndex].content = data.text;
        setThreadItems(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
      setShowAiMenu(false);
    }
  };

  // @Mention Autocomplete State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<{ id: string; name: string; username: string; avatar?: string }[]>([]);
  const [mentionMatchIndex, setMentionMatchIndex] = useState<{ start: number; end: number } | null>(null);

  // Media Tagging State
  interface TaggedUser {
    userId: string;
    username: string;
    name: string;
  }
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [showTagPeopleModal, setShowTagPeopleModal] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [tagSearchResults, setTagSearchResults] = useState<{ id: string; name: string; username: string; avatar?: string }[]>([]);

  // Mention Search Fetcher
  useEffect(() => {
    if (!mentionQuery || !mentionQuery.trim()) {
      setMentionResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(mentionQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setMentionResults(data.users || []);
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [mentionQuery]);

  // Tag People Search Fetcher
  useEffect(() => {
    if (!tagSearchQuery.trim()) {
      setTagSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(tagSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setTagSearchResults(data.users || []);
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [tagSearchQuery]);

  const checkMentionTrigger = (val: string, target: HTMLTextAreaElement) => {
    const cursorPos = target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      if (charBeforeAt === " " || charBeforeAt === "\n") {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        if (!query.includes(" ")) {
          setMentionQuery(query);
          setMentionMatchIndex({ start: lastAtIndex, end: cursorPos });
          return;
        }
      }
    }
    setMentionQuery(null);
    setMentionMatchIndex(null);
  };

  const insertMention = (username: string) => {
    if (!mentionMatchIndex) return;
    const currentText = threadItems[activeItemIndex]?.content || "";
    const newText = currentText.slice(0, mentionMatchIndex.start) + `@${username} ` + currentText.slice(mentionMatchIndex.end);

    const updated = [...threadItems];
    updated[activeItemIndex].content = newText;
    setThreadItems(updated);

    setMentionQuery(null);
    setMentionMatchIndex(null);
  };

  const toggleTagUser = (u: { id: string; username?: string | null; name?: string | null }) => {
    const handle = u.username || u.name || "user";
    const displayName = u.name || handle;
    const exists = taggedUsers.some(existing => existing.userId === u.id);
    if (exists) {
      setTaggedUsers(taggedUsers.filter(existing => existing.userId !== u.id));
    } else {
      setTaggedUsers([...taggedUsers, { userId: u.id, username: handle, name: displayName }]);
    }
  };

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
    checkMentionTrigger(val, target);
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
      if (validItems.length > 1) {
        // Send as batch thread
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadPosts: validItems.map(item => ({
              content: item.content,
              imageUrl: item.imageUrl || null,
              videoUrl: item.videoUrl || null,
              linkUrl: item.linkUrl || null,
              location: location || null,
            }))
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Failed to create thread");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Single post
        const item = validItems[0];
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: item.content,
            imageUrl: item.imageUrl,
            videoUrl: item.videoUrl,
            linkUrl: item.linkUrl,
            location: location,
            audioUrl: recordedAudioUrl,
            mediaTags: taggedUsers.length > 0 ? JSON.stringify(taggedUsers) : null,
            pollData: pollData ? {
              question: item.content || "Poll",
              options: pollData.options.map((text, i) => ({ id: i + 1, text, votes: [] })),
              expiresAt: new Date(Date.now() + pollData.durationHours * 3600 * 1000).toISOString()
            } : null,
            scheduledAt: scheduledAt,
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
      setRecordedAudioUrl(null);
      setTaggedUsers([]);
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
        <button type="button" onClick={() => setShowGifModal(true)} className="hover-bg-circle" style={{ width: "36px", height: "36px", color: "var(--color-primary)" }} title="GIF & Memes">
          <FileType size={19} />
        </button>
        <button type="button" onClick={() => setShowAiMenu(!showAiMenu)} className="hover-bg-circle" style={{ width: "36px", height: "36px", color: "#ec4899" }} title="AI Assistant">
          <Sparkles size={19} className={isAiLoading ? "animate-spin" : ""} />
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
        <button 
          type="button" 
          onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording} 
          className="hover-bg-circle" 
          style={{ width: "36px", height: "36px", color: isRecordingVoice ? "#ff4d4d" : "#10b981" }} 
          title={isRecordingVoice ? "Stop Recording Voice Note" : "Record Voice Note"}
        >
          {isRecordingVoice ? <Square size={17} className="animate-pulse" /> : <Mic size={19} />}
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
      {showGifModal && (
        <GifPickerModal 
          onClose={() => setShowGifModal(false)}
          onSelectGif={(url) => {
            const updated = [...threadItems];
            updated[activeItemIndex].imageUrl = url;
            setThreadItems(updated);
          }}
        />
      )}

      {/* AI Assistant Menu */}
      {showAiMenu && (
        <div style={{ paddingLeft: "52px", marginBottom: "10px" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(139, 92, 246, 0.08))",
            border: "1px solid rgba(236, 72, 153, 0.3)",
            borderRadius: "16px",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ec4899", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} /> AI Post Assistant
              </span>
              {isAiLoading && <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Thinking...</span>}
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => handleAiAction("hashtags")} disabled={isAiLoading} style={{ padding: "5px 12px", borderRadius: "99px", background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-main)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                🏷️ Add Hashtags
              </button>
              <button type="button" onClick={() => handleAiAction("hype")} disabled={isAiLoading} style={{ padding: "5px 12px", borderRadius: "99px", background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-main)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                🔥 Make it Hype!
              </button>
              <button type="button" onClick={() => handleAiAction("professional")} disabled={isAiLoading} style={{ padding: "5px 12px", borderRadius: "99px", background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-main)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                💼 Professional
              </button>
              <button type="button" onClick={() => handleAiAction("polite")} disabled={isAiLoading} style={{ padding: "5px 12px", borderRadius: "99px", background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-main)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                ✨ Friendly
              </button>
              <button type="button" onClick={() => handleAiAction("concise")} disabled={isAiLoading} style={{ padding: "5px 12px", borderRadius: "99px", background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-main)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                ⚡ Concise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingLeft: "52px", marginBottom: "6px" }}>
        {taggedUsers.map((u) => (
          <div key={u.userId} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(29, 155, 240, 0.15)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 700 }}>
            <UserPlus size={13} /> Tagged: @{u.username}
            <button type="button" onClick={() => setTaggedUsers(taggedUsers.filter(item => item.userId !== u.userId))} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 0 }}><X size={12} /></button>
          </div>
        ))}
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
        {isRecordingVoice && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "6px 12px", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 800, border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} className="animate-ping" />
            <span>Recording Voice Note: 00:{voiceRecordTime < 10 ? `0${voiceRecordTime}` : voiceRecordTime} / 00:30</span>
            <button type="button" onClick={stopVoiceRecording} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 0 }}><Square size={14} /></button>
          </div>
        )}
        {recordedAudioUrl && !isRecordingVoice && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "6px 14px", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 700, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            <Mic size={14} /> Voice Note Attached (00:{voiceRecordTime < 10 ? `0${voiceRecordTime}` : voiceRecordTime})
            <button type="button" onClick={() => setRecordedAudioUrl(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 0 }}><X size={14} /></button>
          </div>
        )}
      </div>

      {/* Mention Suggestions Popup */}
      {mentionResults.length > 0 && mentionQuery !== null && (
        <div style={{ paddingLeft: "52px", marginBottom: "10px", position: "relative", zIndex: 50 }}>
          <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "6px", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", gap: "2px", maxHeight: "200px", overflowY: "auto" }}>
            <div style={{ padding: "4px 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Mention Accounts</div>
            {mentionResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user.username || user.name)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--color-text-main)" }}
                className="hover-bg"
              >
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", overflow: "hidden", flexShrink: 0 }}>
                  {user.avatar ? <img src={user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{user.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>@{user.username || user.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag People Modal */}
      {showTagPeopleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "20px", padding: "20px", width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "var(--shadow-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={18} style={{ color: "var(--color-primary)" }} /> Tag People on Media
              </span>
              <button type="button" onClick={() => setShowTagPeopleModal(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search username or name..."
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-main)", fontSize: "0.9rem" }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "220px", overflowY: "auto" }}>
              {tagSearchResults.length === 0 ? (
                <div style={{ padding: "12px", textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {tagSearchQuery.trim() ? "No users found" : "Type a name to search people"}
                </div>
              ) : (
                tagSearchResults.map((user) => {
                  const isTagged = taggedUsers.some(u => u.userId === user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleTagUser(user)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "10px", background: isTagged ? "rgba(29, 155, 240, 0.12)" : "transparent", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-main)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, overflow: "hidden" }}>
                          {user.avatar ? <img src={user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{user.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>@{user.username || user.name}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: isTagged ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                        {isTagged ? "Tagged ✓" : "+ Tag"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowTagPeopleModal(false)}
              style={{ padding: "10px", borderRadius: "9999px", background: "var(--color-primary)", color: "white", fontWeight: 700, border: "none", cursor: "pointer", marginTop: "6px" }}
            >
              Done ({taggedUsers.length} Tagged)
            </button>
          </div>
        </div>
      )}

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
            <button type="button" onClick={() => { const updated = [...threadItems]; updated[0].imageUrl = ""; updated[0].videoUrl = ""; setThreadItems(updated); setTaggedUsers([]); }} style={{ position: "absolute", right: "10px", top: "10px", color: "white", background: "rgba(0, 0, 0, 0.7)", borderRadius: "50%", padding: "5px", zIndex: 2, cursor: "pointer", border: "none" }}>
              <X size={15} />
            </button>
            <button 
              type="button" 
              onClick={() => setShowTagPeopleModal(true)} 
              style={{ position: "absolute", left: "10px", bottom: "10px", color: "white", background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(6px)", borderRadius: "9999px", padding: "6px 12px", zIndex: 2, cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 700 }}
            >
              <UserPlus size={14} /> {taggedUsers.length > 0 ? `${taggedUsers.length} Tagged` : "Tag People"}
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
