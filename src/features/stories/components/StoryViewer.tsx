"use client";

import { useState, useEffect, useRef } from "react";
import { X, Link as LinkIcon, Send, Sparkles, Plus, HelpCircle, MessageSquare } from "lucide-react";
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
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [localOverlays, setLocalOverlays] = useState<any[]>([]);

  // DM Reply Input State
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  // Question response state
  const [questionInput, setQuestionInput] = useState<{ [overlayId: string]: string }>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
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

  // Initialize and parse overlays for the current story
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

  // Pre-buffer next stories (N+1 and N+2) for zero latency
  useEffect(() => {
    const prefetchMedia = (url: string | null, type: string) => {
      if (!url) return;
      if (type === "IMAGE") {
        const img = new Image();
        img.src = url;
      }
    };

    // Current group next stories
    if (currentGroup?.stories[storyIndex + 1]) {
      prefetchMedia(currentGroup.stories[storyIndex + 1].mediaUrl, currentGroup.stories[storyIndex + 1].mediaType);
    }
    if (currentGroup?.stories[storyIndex + 2]) {
      prefetchMedia(currentGroup.stories[storyIndex + 2].mediaUrl, currentGroup.stories[storyIndex + 2].mediaType);
    }

    // Next user group first story
    if (groupedStories[groupIndex + 1]?.stories[0]) {
      prefetchMedia(groupedStories[groupIndex + 1].stories[0].mediaUrl, groupedStories[groupIndex + 1].stories[0].mediaType);
    }
  }, [groupIndex, storyIndex, groupedStories, currentGroup]);

  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setReplyText("");
    setReplySuccess(false);
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

    return () => {
      cancelAnimationFrame(animationFrame);
    };
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

  const handleVote = async (overlayId: string, optionIndex: number) => {
    if (!currentStory) return;
    try {
      const res = await fetch(`/api/stories/${currentStory.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overlayId, optionIndex })
      });
      if (res.ok) {
        const data = await res.json();
        setLocalOverlays(data.overlays);
      }
    } catch (e) {
      console.error("Failed to vote", e);
    }
  };

  // Send Direct Message reply to story author
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
  const isCloseFriendsStory = currentStory.privacy === "CLOSE_FRIENDS" || currentStory.privacy === "FOLLOWING";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "#000", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      
      <div style={{
        position: "relative", width: "100%", maxWidth: "450px", height: "100%", maxHeight: "900px",
        backgroundColor: currentStory.bgColor || "#000", overflow: "hidden", display: "flex", flexDirection: "column"
      }}>
        
        {/* Progress Bars (Styled with Dost Primary Accent Fills) */}
        <div style={{ 
          position: "absolute", top: 0, left: 0, width: "100%", padding: "16px 8px 8px 8px",
          display: "flex", gap: "4px", zIndex: 50,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)"
        }}>
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} style={{ flex: 1, height: "3px", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ 
                height: "100%", backgroundColor: s.privacy === "CLOSE_FRIENDS" ? "#00c853" : "var(--color-primary, #1d9bf0)",
                width: idx < storyIndex ? "100%" : idx === storyIndex ? `${progress}%` : "0%"
              }} />
            </div>
          ))}
        </div>

        {/* Header (User Info with Dost Primary Accent Ring) */}
        <div style={{
          position: "absolute", top: "24px", left: 0, width: "100%", padding: "16px",
          display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", 
              backgroundColor: "#333", padding: "2px",
              background: isCloseFriendsStory 
                ? "#00c853" 
                : "var(--color-primary, #1d9bf0)"
            }}>
              {currentGroup.user.avatar ? (
                <img src={currentGroup.user.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", border: "2px solid #000" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", borderRadius: "50%", border: "2px solid #000", fontWeight: 700 }}>
                  {currentGroup.user.name.charAt(0)}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: "0.9rem", textShadow: "0 1px 3px rgba(0,0,0,0.8)", display: "flex", alignItems: "center", gap: "6px" }}>
                {currentGroup.user.name}
                {isCloseFriendsStory && (
                  <span style={{ background: "rgba(29, 155, 240, 0.9)", color: "white", padding: "2px 8px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    👥 Following Only
                  </span>
                )}
              </span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px" }}>
            <X size={24} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }} />
          </button>
        </div>

        {/* Story Content Area */}
        <div 
          style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.mediaType === "IMAGE" && currentStory.mediaUrl && (
            <img 
              src={currentStory.mediaUrl} 
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterStyleVal }} 
              alt="Story" 
            />
          )}

          {currentStory.mediaType === "VIDEO" && currentStory.mediaUrl && (
            <video 
              ref={videoRef}
              src={currentStory.mediaUrl} 
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterStyleVal }} 
              autoPlay 
              playsInline 
              muted={false}
              onLoadedMetadata={() => setProgress(0)} 
            />
          )}
          
          {/* Audio Track */}
          {currentStory.musicUrl && (
            <audio 
              ref={audioRef}
              src={currentStory.musicUrl} 
              autoPlay 
              onLoadedMetadata={() => setProgress(0)}
            />
          )}

          {currentStory.mediaType === "TEXT" && !currentStory.bgColor && (
             <div style={{ 
               width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", 
               background: "linear-gradient(135deg, var(--color-primary) 0%, #00c6ff 100%)", padding: "32px", textAlign: "center"
             }}>
               {currentStory.content && <p style={{ color: "white", fontSize: "1.5rem", fontWeight: 700 }}>{currentStory.content}</p>}
             </div>
          )}

          {/* Render Active Overlays */}
          {localOverlays.map((overlay) => {
            const isInteractive = ["POLL", "LINK", "MENTION", "HASHTAG", "LOCATION", "QUESTION", "ADD_YOURS"].includes(overlay.type);

            if (overlay.type === "FILTER") return null;

            if (overlay.type === "DRAWING") {
              return (
                <img 
                  key={overlay.id}
                  src={overlay.content} 
                  style={{ 
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%", 
                    objectFit: "contain", zIndex: 15, pointerEvents: "none" 
                  }} 
                  alt=""
                />
              );
            }

            return (
              <div
                key={overlay.id}
                style={{
                  position: "absolute",
                  left: `${overlay.x}%`,
                  top: `${overlay.y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: isInteractive ? 60 : 20,
                  pointerEvents: isInteractive ? "auto" : "none"
                }}
              >
                {/* 1. Poll Overlay Widget */}
                {overlay.type === "POLL" && (() => {
                  const votes = overlay.votes || [0, 0];
                  const totalVotes = votes[0] + votes[1];
                  const votedUserIds = overlay.votedUserIds || {};
                  const hasVoted = currentUserId ? votedUserIds[currentUserId] !== undefined : false;
                  const userVoteIndex = currentUserId ? votedUserIds[currentUserId] : null;

                  const pct0 = totalVotes > 0 ? Math.round((votes[0] / totalVotes) * 100) : 0;
                  const pct1 = totalVotes > 0 ? Math.round((votes[1] / totalVotes) * 100) : 0;

                  return (
                    <div style={{
                      padding: "14px", borderRadius: "18px",
                      background: "rgba(255, 255, 255, 0.95)", color: "#000",
                      width: "180px", display: "flex", flexDirection: "column", gap: "8px",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                      fontFamily: overlay.font, textAlign: "center"
                    }}>
                      <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>{overlay.question}</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {overlay.options?.map((opt: string, oIdx: number) => {
                          const pct = oIdx === 0 ? pct0 : pct1;
                          const isUserChoice = userVoteIndex === oIdx;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleVote(overlay.id, oIdx)}
                              style={{
                                flex: 1, padding: "8px 2px", borderRadius: "10px", border: "none",
                                background: hasVoted 
                                  ? (isUserChoice ? "var(--color-primary)" : "#eee") 
                                  : "rgba(29, 155, 240, 0.15)",
                                color: hasVoted 
                                  ? (isUserChoice ? "white" : "#555") 
                                  : "var(--color-primary)",
                                fontWeight: 700, fontSize: "0.75rem", cursor: "pointer",
                                display: "flex", flexDirection: "column", alignItems: "center"
                              }}
                            >
                              {hasVoted ? (
                                <>
                                  <span style={{ fontSize: "0.85rem" }}>{pct}%</span>
                                  <span style={{ fontSize: "0.6rem", fontWeight: 500, opacity: 0.8 }}>{opt}</span>
                                </>
                              ) : (
                                opt
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Questions Sticker Widget */}
                {overlay.type === "QUESTION" && (
                  <div style={{
                    padding: "14px", borderRadius: "18px", background: "rgba(255,255,255,0.95)",
                    color: "#000", width: "200px", display: "flex", flexDirection: "column", gap: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)", textAlign: "center"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "var(--color-primary)", fontWeight: 800, fontSize: "0.85rem" }}>
                      <HelpCircle size={16} /> {overlay.question || "Ask me a question"}
                    </div>
                    <input 
                      type="text"
                      placeholder="Type your answer..."
                      value={questionInput[overlay.id] || ""}
                      onChange={(e) => setQuestionInput({ ...questionInput, [overlay.id]: e.target.value })}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && questionInput[overlay.id]?.trim()) {
                          await fetch(`/api/stories/${currentStory.id}/reply`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ replyText: `Question Answer: ${questionInput[overlay.id]}` })
                          });
                          setQuestionInput({ ...questionInput, [overlay.id]: "" });
                          alert("Answer sent to DM!");
                        }
                      }}
                      style={{
                        padding: "8px 12px", borderRadius: "99px", border: "1px solid #ddd",
                        fontSize: "0.8rem", outline: "none", textAlign: "center", background: "#f8f9fa"
                      }}
                    />
                  </div>
                )}

                {/* 3. Add Yours Sticker Chain Widget */}
                {overlay.type === "ADD_YOURS" && (
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenCreateStory) onOpenCreateStory(overlay.prompt || "Add Yours");
                    }}
                    style={{
                      padding: "10px 18px", borderRadius: "16px",
                      background: "linear-gradient(45deg, var(--color-primary), #00c6ff)",
                      color: "#fff", border: "none", cursor: "pointer",
                      fontWeight: 800, fontSize: "0.85rem", boxShadow: "0 6px 20px rgba(29, 155, 240, 0.4)",
                      display: "flex", alignItems: "center", gap: "8px"
                    }}
                  >
                    <Plus size={16} /> {overlay.prompt || "Add Yours"}
                  </button>
                )}

                {/* 4. Link Sticker Widget */}
                {overlay.type === "LINK" && (
                  <a
                    href={overlay.content.startsWith("http") ? overlay.content : `https://${overlay.content}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: "8px 16px", borderRadius: "99px",
                      background: "var(--color-primary, #1d9bf0)", color: "#fff",
                      fontWeight: 700, fontSize: "0.8rem", textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      display: "flex", alignItems: "center", gap: "4px"
                    }}
                  >
                    <LinkIcon size={12} /> {overlay.linkLabel || "Visit Link"}
                  </a>
                )}

                {/* 5. Mention Link Sticker Widget */}
                {overlay.type === "MENTION" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      const handle = overlay.content.replace(/^@/, '');
                      router.push(`/search?q=${handle}`);
                    }}
                    style={{
                      padding: "6px 14px", borderRadius: "12px", border: "none", cursor: "pointer",
                      background: "rgba(255,255,255,0.95)", color: "var(--color-primary)",
                      fontWeight: 800, fontSize: `${overlay.fontSize}px`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  >
                    {overlay.content}
                  </button>
                )}

                {/* 6. Hashtag / Location Stickers */}
                {(overlay.type === "HASHTAG" || overlay.type === "LOCATION") && (() => {
                  const colorMap = {
                    HASHTAG: { bg: "rgba(255, 230, 109, 0.95)", text: "#000", fw: 800, href: `/search?q=${encodeURIComponent(overlay.content)}` },
                    LOCATION: { bg: "rgba(255,255,255,0.9)", text: "#000", fw: 700, href: `/search?q=${encodeURIComponent(overlay.content)}` }
                  };
                  const styleOpt = colorMap[overlay.type as "HASHTAG" | "LOCATION"];
                  return (
                    <Link
                      href={styleOpt.href}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: "6px 14px", borderRadius: "10px",
                        background: styleOpt.bg, color: styleOpt.text,
                        fontWeight: styleOpt.fw, fontSize: `${overlay.fontSize}px`,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        display: "flex", alignItems: "center", gap: "4px",
                        textDecoration: "none"
                      }}
                    >
                      {overlay.type === "LOCATION" && "📍 "}
                      {overlay.content}
                    </Link>
                  );
                })()}

                {/* 7. Text Display Overlay */}
                {overlay.type === "TEXT" && (
                  <span style={{ color: overlay.color, fontFamily: overlay.font, fontSize: `${overlay.fontSize}px`, fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.8)", whiteSpace: "pre-wrap", textAlign: "center" }}>
                    {overlay.content}
                  </span>
                )}

                {/* 8. Emoji Display Overlay */}
                {overlay.type === "EMOJI" && (
                  <span style={{ fontSize: `${overlay.fontSize}px` }}>{overlay.content}</span>
                )}
              </div>
            );
          })}

          {/* Navigation Tap Zones */}
          <div 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            style={{ position: "absolute", top: 0, left: 0, width: "30%", height: "80%", zIndex: 40 }} 
          />
          <div 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            style={{ position: "absolute", top: 0, right: 0, width: "70%", height: "80%", zIndex: 40 }} 
          />
        </div>

        {/* Quick DM Reply Bar (Bottom Bar Integration) */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: "12px 16px 20px", background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255, 255, 255, 0.15)",
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
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    color: "white", fontSize: "0.88rem", fontWeight: 500
                  }}
                />
              </div>

              <button
                onClick={handleSendDMReply}
                disabled={!replyText.trim() || isSendingReply}
                style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  background: replyText.trim() ? "var(--color-primary, #1d9bf0)" : "rgba(255,255,255,0.2)",
                  color: "white", border: "none", cursor: replyText.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                }}
              >
                <Send size={18} />
              </button>

              {/* Quick Emojis */}
              {["❤️", "🔥", "😂"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={async () => {
                    if (!currentStory) return;
                    await fetch(`/api/stories/${currentStory.id}/react`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ emoji }),
                    }).catch(() => {});
                  }}
                  style={{
                    fontSize: "1.2rem", background: "none", border: "none", cursor: "pointer"
                  }}
                  className="hover-scale"
                >
                  {emoji}
                </button>
              ))}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
