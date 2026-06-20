"use client";

import { useState, useEffect, useRef } from "react";
import { X, Link as LinkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

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
}

const FILTERS = [
  { id: "none", name: "Normal", value: "" },
  { id: "grayscale", name: "B&W", value: "grayscale(1)" },
  { id: "sepia", name: "Sepia", value: "sepia(1)" },
  { id: "vintage", name: "Vintage", value: "sepia(0.5) contrast(1.2) brightness(0.9)" },
  { id: "cool", name: "Cool", value: "saturate(1.2) hue-rotate(15deg)" },
  { id: "warm", name: "Warm", value: "sepia(0.3) saturate(1.3) contrast(1.1)" }
];

export function StoryViewer({ groupedStories, initialGroupIndex, onClose }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [localOverlays, setLocalOverlays] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentGroup = groupedStories[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Duration in ms for non-video stories
  const STORY_DURATION = 5000;

  // Fetch current user ID on mount (to verify poll voter records)
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

  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
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
        // If there's music on a photo, cap at max 15 seconds
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
        // Update local overlays with updated vote counts
        setLocalOverlays(data.overlays);
      }
    } catch (e) {
      console.error("Failed to vote", e);
    }
  };

  if (!currentGroup || !currentStory) return null;

  // Retrieve current active filter style values
  const filterOverlay = localOverlays.find(o => o.type === "FILTER");
  const filterStyleVal = filterOverlay ? FILTERS.find(f => f.id === filterOverlay.content)?.value || "" : "";

  // Render Story Rings styling indicator based on privacy
  const isCloseFriendsStory = currentStory.privacy === "CLOSE_FRIENDS";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "#000", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      
      <div style={{
        position: "relative", width: "100%", maxWidth: "450px", height: "100%", maxHeight: "900px",
        backgroundColor: currentStory.bgColor || "#000", overflow: "hidden", display: "flex", flexDirection: "column"
      }}>
        
        {/* Progress Bars */}
        <div style={{ 
          position: "absolute", top: 0, left: 0, width: "100%", padding: "16px 8px 8px 8px",
          display: "flex", gap: "4px", zIndex: 50,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)"
        }}>
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} style={{ flex: 1, height: "3px", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ 
                height: "100%", backgroundColor: s.privacy === "CLOSE_FRIENDS" ? "#00c853" : "#fff",
                width: idx < storyIndex ? "100%" : idx === storyIndex ? `${progress}%` : "0%"
              }} />
            </div>
          ))}
        </div>

        {/* Header (User Info) */}
        <div style={{
          position: "absolute", top: "24px", left: 0, width: "100%", padding: "16px",
          display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "36px", 
              height: "36px", 
              borderRadius: "50%", 
              overflow: "hidden", 
              backgroundColor: "#333",
              padding: "2px",
              background: isCloseFriendsStory 
                ? "#00c853" 
                : "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)"
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
              <span style={{ color: "white", fontWeight: 600, fontSize: "0.9rem", textShadow: "0 1px 3px rgba(0,0,0,0.8)", display: "flex", alignItems: "center", gap: "6px" }}>
                {currentGroup.user.name}
                {isCloseFriendsStory && (
                  <span style={{ background: "#00c853", color: "white", padding: "1px 6px", borderRadius: "6px", fontSize: "0.65rem", fontWeight: 700 }}>
                    Close Friend
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
               background: "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)", padding: "32px", textAlign: "center"
             }}>
               {currentStory.content && <p style={{ color: "white", fontSize: "1.5rem", fontWeight: 600 }}>{currentStory.content}</p>}
             </div>
          )}

          {/* Render Active Overlays */}
          {localOverlays.map((overlay) => {
            const isInteractive = ["POLL", "LINK", "MENTION", "HASHTAG", "LOCATION"].includes(overlay.type);

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
                                  : "var(--color-primary-light)",
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

                {/* 2. Link Sticker Widget */}
                {overlay.type === "LINK" && (
                  <a
                    href={overlay.content.startsWith("http") ? overlay.content : `https://${overlay.content}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: "8px 16px", borderRadius: "99px",
                      background: "rgba(29, 155, 240, 0.95)", color: "#fff",
                      fontWeight: 700, fontSize: "0.8rem", textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      display: "flex", alignItems: "center", gap: "4px"
                    }}
                  >
                    <LinkIcon size={12} /> {overlay.linkLabel || "Visit Link"}
                  </a>
                )}

                {/* 3. Mention/Hashtag/Location Link Widgets */}
                {(overlay.type === "MENTION" || overlay.type === "HASHTAG" || overlay.type === "LOCATION") && (() => {
                  const colorMap = {
                    MENTION: { bg: "rgba(255,255,255,0.9)", text: "var(--color-primary)", fw: 800, href: `/search?q=${overlay.content}` },
                    HASHTAG: { bg: "rgba(255, 230, 109, 0.95)", text: "#000", fw: 800, href: `/search?q=${encodeURIComponent(overlay.content)}` },
                    LOCATION: { bg: "rgba(255,255,255,0.9)", text: "#000", fw: 700, href: `/search?q=${encodeURIComponent(overlay.content)}` }
                  };
                  const styleOpt = colorMap[overlay.type as "MENTION" | "HASHTAG" | "LOCATION"];
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

                {/* 4. Text Display Overlay */}
                {overlay.type === "TEXT" && (
                  <span style={{ color: overlay.color, fontFamily: overlay.font, fontSize: `${overlay.fontSize}px`, fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.8)", whiteSpace: "pre-wrap", textAlign: "center" }}>
                    {overlay.content}
                  </span>
                )}

                {/* 5. Emoji/Sticker Display Overlay */}
                {overlay.type === "EMOJI" && (
                  <span style={{ fontSize: `${overlay.fontSize}px` }}>{overlay.content}</span>
                )}
              </div>
            );
          })}

          {/* Navigation Tap Zones */}
          <div 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            style={{ position: "absolute", top: 0, left: 0, width: "30%", height: "100%", zIndex: 40 }} 
          />
          <div 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            style={{ position: "absolute", top: 0, right: 0, width: "70%", height: "100%", zIndex: 40 }} 
          />
        </div>
      </div>

    </div>
  );
}
