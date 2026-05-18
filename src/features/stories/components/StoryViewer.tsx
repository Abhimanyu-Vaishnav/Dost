"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Story {
  id: string;
  authorId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string;
  musicUrl: string | null;
  overlays: string | null;
  bgColor: string | null;
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

export function StoryViewer({ groupedStories, initialGroupIndex, onClose }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentGroup = groupedStories[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Duration in ms for non-video stories
  const STORY_DURATION = 5000;

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
        // If there's music on a photo, cap at max 15 seconds or duration of music
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

  if (!currentGroup || !currentStory) return null;

  let parsedOverlays: any[] = [];
  try {
    if (currentStory.overlays) {
      parsedOverlays = JSON.parse(currentStory.overlays);
    }
  } catch (e) { console.error("Failed to parse overlays", e); }

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
                height: "100%", backgroundColor: "#fff",
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
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#333" }}>
              {currentGroup.user.avatar ? (
                <img src={currentGroup.user.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                  {currentGroup.user.name.charAt(0)}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "white", fontWeight: 600, fontSize: "0.9rem", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{currentGroup.user.name}</span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px" }}>
            <X size={24} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }} />
          </button>
        </div>

        {/* Story Content */}
        <div 
          style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.mediaType === "IMAGE" && currentStory.mediaUrl && (
            <img src={currentStory.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Story" />
          )}

          {currentStory.mediaType === "VIDEO" && currentStory.mediaUrl && (
            <video 
              ref={videoRef}
              src={currentStory.mediaUrl} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
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

          {/* Render Overlays */}
          {parsedOverlays.map((overlay) => (
            <div
              key={overlay.id}
              style={{
                position: "absolute",
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 20,
                pointerEvents: "none"
              }}
            >
              {overlay.type === "TEXT" ? (
                <span style={{ color: overlay.color, fontFamily: overlay.font, fontSize: `${overlay.fontSize}px`, fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.8)", whiteSpace: "pre-wrap", textAlign: "center" }}>
                  {overlay.content}
                </span>
              ) : (
                <span style={{ fontSize: `${overlay.fontSize}px` }}>{overlay.content}</span>
              )}
            </div>
          ))}

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
