"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Music2, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export interface ShortItem {
  id: string;
  title: string;
  videoUrl: string;
  author: {
    id: string;
    name?: string | null;
    username?: string | null;
    avatar?: string | null;
    isVerified?: boolean;
  };
  likesCount: number;
  commentsCount: number;
  audioTitle?: string;
}

interface ShortCardProps {
  short: ShortItem;
  isActive: boolean;
}

export function ShortCard({ short, isActive }: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(short.likesCount);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
  };

  const authorName = short.author.name || "User";
  const userHandle = `@${short.author.username || authorName.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      backgroundColor: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      scrollSnapAlign: "start"
    }}>
      {/* Video element */}
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          cursor: "pointer"
        }}
      />

      {/* Heart Pulse Overlay on Double-Tap / Like */}
      {showHeartAnim && (
        <div className="animate-scale-in" style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 20
        }}>
          <Heart size={90} fill="#ef4444" color="#ef4444" style={{ filter: "drop-shadow(0 10px 20px rgba(239,68,68,0.6))" }} />
        </div>
      )}

      {/* Top Controls Bar */}
      <div style={{
        position: "absolute",
        top: "20px", left: "20px", right: "20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "white", fontWeight: 800, fontSize: "1.1rem" }}>
          <Sparkles size={20} style={{ color: "var(--color-primary)" }} />
          <span>DOST Shorts</span>
        </div>

        <button 
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.2)", color: "white",
            width: "38px", height: "38px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer"
          }}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Action Buttons Right Side Bar */}
      <div style={{
        position: "absolute",
        right: "16px",
        bottom: "80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        zIndex: 10
      }}>
        {/* Like */}
        <button 
          onClick={toggleLike}
          style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
        >
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: liked ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Heart size={26} fill={liked ? "#ef4444" : "none"} color={liked ? "#ef4444" : "white"} />
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{likesCount}</span>
        </button>

        {/* Comment */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "white", cursor: "pointer" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MessageCircle size={26} />
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{short.commentsCount}</span>
        </div>

        {/* Share */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "white", cursor: "pointer" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Share2 size={24} />
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Share</span>
        </div>
      </div>

      {/* Bottom Info Overlay */}
      <div style={{
        position: "absolute",
        bottom: "20px", left: "16px", right: "80px",
        display: "flex", flexDirection: "column", gap: "10px",
        color: "white", zIndex: 10,
        textShadow: "0 2px 4px rgba(0,0,0,0.8)"
      }}>
        {/* Author details */}
        <Link href={`/profile/${short.author.id}`} style={{ textDecoration: "none", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: "2px solid var(--color-primary)", overflow: "hidden" }}>
            {short.author.avatar ? (
              <img src={short.author.avatar} alt={authorName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                {authorName.charAt(0)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontWeight: 800, fontSize: "1rem" }}>{authorName}</span>
              {short.author.isVerified && <CheckCircle2 size={15} style={{ color: "var(--color-primary)", fill: "var(--color-primary)", stroke: "#000" }} />}
            </div>
            <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{userHandle}</span>
          </div>
        </Link>

        {/* Video Title */}
        <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.4, fontWeight: 500 }}>
          {short.title}
        </p>

        {/* Audio Track Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", opacity: 0.9 }}>
          <Music2 size={14} className="animate-spin" />
          <span>{short.audioTitle || `Original Sound - ${authorName}`}</span>
        </div>
      </div>
    </div>
  );
}
