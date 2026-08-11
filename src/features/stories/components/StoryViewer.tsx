"use client";

import { useState, useEffect, useRef } from "react";
import { X, Link as LinkIcon, Send, Sparkles, Plus, HelpCircle, MessageSquare, ChevronLeft, ChevronRight, Volume2, VolumeX, Clock, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Story {
  id: string;
  authorId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string;
  musicUrl: string | null;
  overlays: string | null;
  bgColor: string | null;
  privacy: string;
  allowedUsers: string | null;
  createdAt: string;
  expiresAt: string;
}

interface UserWithStories {
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  stories: Story[];
}

interface StoryViewerProps {
  groupedStories: UserWithStories[];
  initialGroupIndex: number;
  onClose: () => void;
  onOpenCreateStory?: (prompt?: string) => void;
}

const FILTERS = [
  { id: "none", name: "Normal", value: "" },
  { id: "grayscale", name: "B&W", value: "grayscale(1)" },
  { id: "sepia", name: "Sepia", value: "sepia(1)" },
  { id: "vintage", name: "Vintage", value: "sepia(0.5) contrast(1.2) brightness(0.9)" },
  { id: "cool", name: "Cool", value: "saturate(1.2) hue-rotate(15deg)" },
  { id: "warm", name: "Warm", value: "sepia(0.3) saturate(1.3) contrast(1.1)" }
];

export function StoryViewer({ groupedStories, initialGroupIndex, onClose, onOpenCreateStory }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cleanViewMode, setCleanViewMode] = useState(false); // Long-press hides overlays
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [localOverlays, setLocalOverlays] = useState<any[]>([]);

  // DM Reply Input State
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  // Question & Slider Sticker States
  const [questionInput, setQuestionInput] = useState<{ [overlayId: string]: string }>({});
  const [sliderVal, setSliderVal] = useState<{ [overlayId: string]: number }>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasParticlesRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const currentGroup = groupedStories[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Duration in ms for non-video stories
  const STORY_DURATION = 5000;

  // Fetch current user ID on mount
  useEffect(() => {
    fetch("/api/users/profile")
      .then(r => r.json())
      .then(d => {
        if (d.user) setCurrentUserId(d.user.id);
      });
  }, []);

  // Parse overlays
  useEffect(() => {
    if (currentStory && currentStory.overlays) {
      try {
        setLocalOverlays(JSON.parse(currentStory.overlays));
      } catch (e) {
        setLocalOverlays([]);
      }
    } else {
      setLocalOverlays([]);
    }
  }, [groupIndex, storyIndex, currentStory]);

  // Network-Aware Pre-Buffering Engine
  useEffect(() => {
    const isDataSaver = (navigator as any).connection?.saveData === true;
    const isFastConnection = (navigator as any).connection?.effectiveType === "4g" || !isDataSaver;

    const prefetchMedia = (url: string | null, type: string) => {
      if (!url) return;
      if (type === "IMAGE") {
        const img = new Image();
        img.src = url;
      }
    };

    if (currentGroup?.stories[storyIndex + 1]) {
      prefetchMedia(currentGroup.stories[storyIndex + 1].mediaUrl, currentGroup.stories[storyIndex + 1].mediaType);
    }
    
    if (isFastConnection && currentGroup?.stories[storyIndex + 2]) {
      prefetchMedia(currentGroup.stories[storyIndex + 2].mediaUrl, currentGroup.stories[storyIndex + 2].mediaType);
    }

    if (groupedStories[groupIndex + 1]?.stories[0]) {
      prefetchMedia(groupedStories[groupIndex + 1].stories[0].mediaUrl, groupedStories[groupIndex + 1].stories[0].mediaType);
    }
  }, [groupIndex, storyIndex, groupedStories, currentGroup]);

  // PC Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        setIsPaused(prev => !prev);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (groupIndex > 0) {
          setGroupIndex(groupIndex - 1);
          setStoryIndex(0);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (groupIndex < groupedStories.length - 1) {
          setGroupIndex(groupIndex + 1);
          setStoryIndex(0);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsMuted(prev => {
          const next = !prev;
          if (videoRef.current) videoRef.current.muted = next;
          if (audioRef.current) audioRef.current.muted = next;
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [groupIndex, storyIndex, groupedStories, isMuted]);

  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setReplyText("");
    setReplySuccess(false);
    setCleanViewMode(false);
  }, [groupIndex, storyIndex]);

  useEffect(() => {
    if (isPaused) {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      return;
    } else {
      if (videoRef.current) videoRef.current.play().catch(e => console.log(e));
      if (audioRef.current) audioRef.current.play().catch(e => console.log(e));
    }

    let animationFrame: number;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      let duration = STORY_DURATION;
      if (currentStory?.mediaType === "VIDEO" && videoRef.current) {
        duration = (videoRef.current.duration || 5) * 1000; 
      } else if (currentStory?.musicUrl && audioRef.current) {
        duration = Math.min((audioRef.current.duration || 15) * 1000, 15000);
      }

      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        handleNext();
      } else {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [groupIndex, storyIndex, isPaused, currentStory]);

  const handleNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < groupedStories.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setStoryIndex(groupedStories[groupIndex - 1].stories.length - 1);
    }
  };

  // HTML5 Canvas Floating Emoji Particle Stream Generator
  const triggerEmojiStream = (emojiSymbol: string) => {
    const canvas = canvasParticlesRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 420;
    canvas.height = canvas.parentElement?.clientHeight || 740;

    const particles: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; scale: number }> = [];

    for (let i = 0; i < 10; i++) {
      particles.push({
        x: canvas.width * 0.85 + (Math.random() * 40 - 20),
        y: canvas.height * 0.9,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -(3 + Math.random() * 4),
        alpha: 1,
        scale: 24 + Math.random() * 16
      });
    }

    let animId: number;
    const renderParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      particles.forEach((p) => {
        if (p.alpha <= 0) return;
        aliveCount++;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.015;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.font = `${p.scale}px sans-serif`;
        ctx.fillText(emojiSymbol, p.x, p.y);
        ctx.restore();
      });

      if (aliveCount > 0) {
        animId = requestAnimationFrame(renderParticles);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    renderParticles();
  };

  // Send DM Reply to story author
  const handleSendDMReply = async () => {
    if (!currentStory || !replyText.trim() || isSendingReply) return;
    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/stories/${currentStory.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText })
      });
      if (res.ok) {
        setReplyText("");
        setReplySuccess(true);
        setTimeout(() => setReplySuccess(false), 2500);
      }
    } catch (e) {
      console.error("Failed to send reply", e);
    } finally {
      setIsSendingReply(false);
    }
  };

  if (!currentGroup || !currentStory) return null;

  const filterOverlay = localOverlays.find(o => o.type === "FILTER");
  const filterStyleVal = filterOverlay ? FILTERS.find(f => f.id === filterOverlay.content)?.value || "" : "";
  const isFollowingOnlyStory = currentStory.privacy === "CLOSE_FRIENDS" || currentStory.privacy === "FOLLOWING";

  const prevUserGroup = groupIndex > 0 ? groupedStories[groupIndex - 1] : null;
  const nextUserGroup = groupIndex < groupedStories.length - 1 ? groupedStories[groupIndex + 1] : null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.92)", zIndex: 9999, backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      
      {/* Desktop Stage Wrapper with Left & Right Peek Sidebars */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "32px",
        width: "100%", height: "100%", position: "relative"
      }}>

        {/* Desktop Left Peek Preview Card (Previous User Story) */}
        {prevUserGroup && (
          <div 
            onClick={() => { setGroupIndex(groupIndex - 1); setStoryIndex(0); }}
            style={{
              width: "180px", height: "320px", borderRadius: "20px", overflow: "hidden",
              opacity: 0.45, transform: "scale(0.9)", cursor: "pointer", transition: "all 0.3s ease",
              position: "relative", border: "1px solid rgba(255,255,255,0.2)",
              display: "none", filter: "blur(1px)"
            }}
            className="desktop-only-flex hover-scale"
          >
            <img src={prevUserGroup.stories[0]?.mediaUrl || prevUserGroup.user.avatar || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "white" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid var(--color-primary)", overflow: "hidden" }}>
                <img src={prevUserGroup.user.avatar || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{prevUserGroup.user.name.split(" ")[0]}</span>
            </div>
          </div>
        )}

        {/* Central Active Story Stage (9:16 Centered Frame) */}
        <div style={{
          position: "relative", width: "100%", maxWidth: "420px", height: "100%", maxHeight: "740px",
          backgroundColor: currentStory.bgColor || "#000", overflow: "hidden", display: "flex", flexDirection: "column",
          borderRadius: "28px", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.15)"
        }}>

          {/* HTML5 Canvas Floating Emoji Stream Layer */}
          <canvas
            ref={canvasParticlesRef}
            style={{ position: "absolute", inset: 0, zIndex: 70, pointerEvents: "none" }}
          />
          
          {/* Progress Bars */}
          {!cleanViewMode && (
            <div style={{ 
              position: "absolute", top: 0, left: 0, width: "100%", padding: "16px 12px 8px",
              display: "flex", gap: "4px", zIndex: 50,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)"
            }}>
              {currentGroup.stories.map((s, idx) => (
                <div key={s.id} style={{ flex: 1, height: "3px", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ 
                    height: "100%", backgroundColor: isFollowingOnlyStory ? "var(--color-primary, #1d9bf0)" : "var(--color-primary, #1d9bf0)",
                    boxShadow: "0 0 8px var(--color-primary)",
                    width: idx < storyIndex ? "100%" : idx === storyIndex ? `${progress}%` : "0%"
                  }} />
                </div>
              ))}
            </div>
          )}

          {/* Header User Info */}
          {!cleanViewMode && (
            <div style={{
              position: "absolute", top: "24px", left: 0, width: "100%", padding: "16px",
              display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ 
                  width: "38px", height: "38px", borderRadius: "50%", overflow: "hidden", 
                  padding: "2px", background: "var(--color-primary, #1d9bf0)"
                }}>
                  {currentGroup.user.avatar ? (
                    <img src={currentGroup.user.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", borderRadius: "50%", fontWeight: 700 }}>
                      {currentGroup.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: "0.9rem", textShadow: "0 1px 3px rgba(0,0,0,0.8)", display: "flex", alignItems: "center", gap: "6px" }}>
                    {currentGroup.user.name}
                    {isFollowingOnlyStory && (
                      <span style={{ background: "rgba(29, 155, 240, 0.9)", color: "white", padding: "2px 8px", borderRadius: "99px", fontSize: "0.68rem", fontWeight: 800 }}>
                        👥 Following Only
                      </span>
                    )}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                    {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button 
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (videoRef.current) videoRef.current.muted = !isMuted;
                    if (audioRef.current) audioRef.current.muted = !isMuted;
                  }}
                  style={{ background: "rgba(0,0,0,0.4)", border: "none", color: "white", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Toggle Mute (M)"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button onClick={onClose} style={{ background: "rgba(0,0,0,0.4)", border: "none", color: "white", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Media Content Area */}
          <div 
            style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseDown={() => { setIsPaused(true); setCleanViewMode(true); }}
            onMouseUp={() => { setIsPaused(false); setCleanViewMode(false); }}
            onTouchStart={() => { setIsPaused(true); setCleanViewMode(true); }}
            onTouchEnd={() => { setIsPaused(false); setCleanViewMode(false); }}
          >
            {currentStory.mediaType === "IMAGE" && currentStory.mediaUrl && (
              <img src={currentStory.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterStyleVal }} alt="Story" />
            )}

            {currentStory.mediaType === "VIDEO" && currentStory.mediaUrl && (
              <video 
                ref={videoRef}
                src={currentStory.mediaUrl} 
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterStyleVal }} 
                autoPlay 
                playsInline 
                muted={isMuted}
                onLoadedMetadata={() => setProgress(0)} 
              />
            )}
            
            {currentStory.musicUrl && (
              <audio ref={audioRef} src={currentStory.musicUrl} autoPlay muted={isMuted} onLoadedMetadata={() => setProgress(0)} />
            )}

            {currentStory.mediaType === "TEXT" && !currentStory.bgColor && (
               <div style={{ 
                 width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", 
                 background: "linear-gradient(135deg, var(--color-primary) 0%, #00c6ff 100%)", padding: "32px", textAlign: "center"
               }}>
                 {currentStory.content && <p style={{ color: "white", fontSize: "1.5rem", fontWeight: 700 }}>{currentStory.content}</p>}
               </div>
            )}

            {/* Overlays Rendering */}
            {!cleanViewMode && localOverlays.map((overlay) => {
              const isInteractive = ["POLL", "LINK", "MENTION", "HASHTAG", "LOCATION", "QUESTION", "ADD_YOURS"].includes(overlay.type);

              if (overlay.type === "FILTER") return null;

              if (overlay.type === "DRAWING") {
                return (
                  <img key={overlay.id} src={overlay.content} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 15, pointerEvents: "none" }} alt="" />
                );
              }

              return (
                <div
                  key={overlay.id}
                  style={{
                    position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`,
                    transform: "translate(-50%, -50%)", zIndex: isInteractive ? 60 : 20,
                    pointerEvents: isInteractive ? "auto" : "none"
                  }}
                >
                  {/* Poll Widget */}
                  {overlay.type === "POLL" && (
                    <div style={{ padding: "14px", borderRadius: "18px", background: "rgba(255, 255, 255, 0.95)", color: "#000", width: "180px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 6px 20px rgba(0,0,0,0.15)", textAlign: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>{overlay.question}</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {overlay.options?.map((opt: string, oIdx: number) => (
                          <button key={oIdx} onClick={() => {}} style={{ flex: 1, padding: "8px 2px", borderRadius: "10px", border: "none", background: "rgba(29, 155, 240, 0.15)", color: "var(--color-primary)", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link Widget */}
                  {overlay.type === "LINK" && (
                    <a href={overlay.content.startsWith("http") ? overlay.content : `https://${overlay.content}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ padding: "8px 16px", borderRadius: "99px", background: "var(--color-primary, #1d9bf0)", color: "#fff", fontWeight: 700, fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                      <LinkIcon size={12} /> {overlay.linkLabel || "Visit Link"}
                    </a>
                  )}

                  {/* Mention Sticker */}
                  {overlay.type === "MENTION" && (
                    <button onClick={(e) => { e.stopPropagation(); onClose(); router.push(`/search?q=${overlay.content.replace(/^@/, '')}`); }} style={{ padding: "6px 14px", borderRadius: "12px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.95)", color: "var(--color-primary)", fontWeight: 800, fontSize: `${overlay.fontSize}px` }}>
                      {overlay.content}
                    </button>
                  )}

                  {/* Text Overlay */}
                  {overlay.type === "TEXT" && (
                    <span style={{ color: overlay.color, fontFamily: overlay.font, fontSize: `${overlay.fontSize}px`, fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{overlay.content}</span>
                  )}
                </div>
              );
            })}

            {/* Tap Zones */}
            <div onClick={(e) => { e.stopPropagation(); handlePrev(); }} style={{ position: "absolute", top: 0, left: 0, width: "30%", height: "80%", zIndex: 40 }} />
            <div onClick={(e) => { e.stopPropagation(); handleNext(); }} style={{ position: "absolute", top: 0, right: 0, width: "70%", height: "80%", zIndex: 40 }} />
          </div>

          {/* Quick DM Reply Bar with Canvas Particle Reaction Trigger */}
          {!cleanViewMode && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "12px 16px 18px", background: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(14px)", borderTop: "1px solid rgba(255, 255, 255, 0.15)",
                display: "flex", alignItems: "center", gap: "10px", zIndex: 60
              }}
            >
              {replySuccess ? (
                <div style={{ flex: 1, padding: "10px", borderRadius: "99px", background: "rgba(0, 200, 83, 0.2)", color: "#00c853", fontWeight: 700, fontSize: "0.85rem", textAlign: "center" }}>
                  ✓ Reply sent to {currentGroup.user.name}'s DMs!
                </div>
              ) : (
                <>
                  <div style={{
                    flex: 1, display: "flex", alignItems: "center", gap: "8px",
                    background: "rgba(255,255,255,0.12)", borderRadius: "99px",
                    padding: "8px 16px", border: "1px solid rgba(255,255,255,0.2)"
                  }}>
                    <input
                      type="text"
                      placeholder={`Reply to ${currentGroup.user.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendDMReply()}
                      onFocus={() => setIsPaused(true)}
                      onBlur={() => setIsPaused(false)}
                      style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: "0.88rem" }}
                    />
                  </div>

                  <button
                    onClick={handleSendDMReply}
                    disabled={!replyText.trim() || isSendingReply}
                    style={{
                      width: "40px", height: "40px", borderRadius: "50%",
                      background: replyText.trim() ? "var(--color-primary, #1d9bf0)" : "rgba(255,255,255,0.2)",
                      color: "white", border: "none", cursor: replyText.trim() ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <Send size={18} />
                  </button>

                  {/* Floating Particle Reaction Triggers */}
                  {["❤️", "🔥", "😂", "👏"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        triggerEmojiStream(emoji);
                        if (currentStory) {
                          fetch(`/api/stories/${currentStory.id}/react`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ emoji }),
                          }).catch(() => {});
                        }
                      }}
                      style={{ fontSize: "1.25rem", background: "none", border: "none", cursor: "pointer" }}
                      className="hover-scale"
                    >
                      {emoji}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

        </div>

        {/* Desktop Right Peek Preview Card (Next User Story) */}
        {nextUserGroup && (
          <div 
            onClick={() => { setGroupIndex(groupIndex + 1); setStoryIndex(0); }}
            style={{
              width: "180px", height: "320px", borderRadius: "20px", overflow: "hidden",
              opacity: 0.45, transform: "scale(0.9)", cursor: "pointer", transition: "all 0.3s ease",
              position: "relative", border: "1px solid rgba(255,255,255,0.2)",
              display: "none", filter: "blur(1px)"
            }}
            className="desktop-only-flex hover-scale"
          >
            <img src={nextUserGroup.stories[0]?.mediaUrl || nextUserGroup.user.avatar || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "white" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid var(--color-primary)", overflow: "hidden" }}>
                <img src={nextUserGroup.user.avatar || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{nextUserGroup.user.name.split(" ")[0]}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
