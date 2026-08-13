"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Heart, MessageCircle, Share2, Volume2, VolumeX, Music2, Sparkles, CheckCircle2, 
  Send, Bookmark, Repeat, X, Play, Pause 
} from "lucide-react";
import Link from "next/link";
import { ParticleSystem, Particle, createParticleBurst } from "@/features/posts/components/ParticleSystem";

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

interface Comment {
  id: string;
  user: string;
  text: string;
  time: string;
}

export function ShortCard({ short, isActive }: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reposted, setReposted] = useState(false);

  const [likesCount, setLikesCount] = useState(short.likesCount);
  const [commentsCount, setCommentsCount] = useState(short.commentsCount);

  // Particles & Animations
  const [particles, setParticles] = useState<Particle[]>([]);
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ x: number; y: number } | null>(null);
  const [progress, setProgress] = useState(0);

  // Comments Drawer
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([
    { id: "c1", user: "Rohan Varma", text: "This is super smooth! 🔥", time: "2m ago" },
    { id: "c2", user: "Meghna Nair", text: "Love the UI animations & design ✨", time: "5m ago" }
  ]);
  const [newComment, setNewComment] = useState("");
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

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

  // Interactive Like Button Handler with Particle Burst (Same as X Posts)
  const triggerLikeBurst = (clientX?: number, clientY?: number) => {
    let x = clientX;
    let y = clientY;

    if (!x || !y) {
      // Default to Like Button Position
      x = window.innerWidth - 40;
      y = window.innerHeight - 300;
    }

    const newBurst = createParticleBurst('like', x, y, 16);
    setParticles(prev => [...prev, ...newBurst]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newBurst.some(nb => nb.id === p.id)));
    }, 1000);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    if (liked) {
      setLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
      triggerLikeBurst(x, y);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!liked) {
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }

    setDoubleTapHeart({ x: e.clientX, y: e.clientY });
    triggerLikeBurst(e.clientX, e.clientY);

    setTimeout(() => setDoubleTapHeart(null), 800);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    setBookmarked(!bookmarked);
    if (!bookmarked) {
      const newBurst = createParticleBurst('bookmark', x, y, 12);
      setParticles(prev => [...prev, ...newBurst]);
      setTimeout(() => setParticles(prev => prev.filter(p => !newBurst.some(nb => nb.id === p.id))), 1000);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const newBurst = createParticleBurst('share', x, y, 12);
    setParticles(prev => [...prev, ...newBurst]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newBurst.some(nb => nb.id === p.id))), 1000);

    navigator.clipboard?.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentObj: Comment = {
      id: Date.now().toString(),
      user: "You",
      text: newComment.trim(),
      time: "Just now"
    };

    setCommentsList(prev => [commentObj, ...prev]);
    setCommentsCount(prev => prev + 1);
    setNewComment("");
  };

  const authorName = short.author.name || "User";
  const userHandle = `@${short.author.username || authorName.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <div 
      ref={containerRef}
      onDoubleClick={handleDoubleTap}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        userSelect: "none"
      }}
    >
      {/* Particle System Engine */}
      <ParticleSystem particles={particles} type="like" />

      {/* Video Canvas */}
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          cursor: "pointer"
        }}
      />

      {/* Play/Pause Overlay indicator when tapped */}
      {!isPlaying && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "70px", height: "70px", borderRadius: "50%",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", pointerEvents: "none", zIndex: 15
        }} className="animate-scale-in">
          <Play size={36} style={{ marginLeft: "4px" }} />
        </div>
      )}

      {/* Double Tap Floating Giant Heart Animation */}
      {doubleTapHeart && (
        <div className="animate-scale-in" style={{
          position: "fixed",
          left: doubleTapHeart.x - 50,
          top: doubleTapHeart.y - 50,
          pointerEvents: "none",
          zIndex: 99
        }}>
          <Heart size={100} fill="#f91880" color="#f91880" style={{ filter: "drop-shadow(0 10px 30px rgba(249,24,128,0.8))" }} />
        </div>
      )}

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="glass animate-slide-up" style={{
          position: "absolute", top: "70px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.8)", border: "1px solid var(--color-primary)",
          borderRadius: "99px", padding: "8px 20px", color: "white", fontWeight: 700,
          fontSize: "0.9rem", zIndex: 90, display: "flex", alignItems: "center", gap: "8px"
        }}>
          <Sparkles size={16} style={{ color: "var(--color-primary)" }} />
          <span>Link copied to clipboard!</span>
        </div>
      )}

      {/* Top Bar */}
      <div style={{
        position: "absolute",
        top: "20px", left: "20px", right: "20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", fontWeight: 900, fontSize: "1.15rem", textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "white"
          }}>
            <Sparkles size={18} />
          </div>
          <span>DOST Shorts</span>
        </div>

        <button 
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)", color: "white",
            width: "40px", height: "40px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer"
          }}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Action Buttons Right Side Bar */}
      <div style={{
        position: "absolute",
        right: "16px",
        bottom: "90px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "22px",
        zIndex: 20
      }}>
        {/* Like Button */}
        <button 
          onClick={handleLikeClick}
          style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
          className="hover:scale-110 active:scale-90 transition-transform"
        >
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: liked ? "rgba(249, 24, 128, 0.25)" : "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)", border: liked ? "1.5px solid #f91880" : "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: liked ? "0 0 20px rgba(249, 24, 128, 0.5)" : "none"
          }}>
            <Heart 
              size={28} 
              fill={liked ? "#f91880" : "none"} 
              color={liked ? "#f91880" : "white"} 
              style={{ transform: liked ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s" }}
            />
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
            {likesCount}
          </span>
        </button>

        {/* Comment Button */}
        <button 
          onClick={() => setShowComments(!showComments)}
          style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
          className="hover:scale-110 active:scale-90 transition-transform"
        >
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MessageCircle size={26} />
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
            {commentsCount}
          </span>
        </button>

        {/* Bookmark Button */}
        <button 
          onClick={handleBookmark}
          style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
          className="hover:scale-110 active:scale-90 transition-transform"
        >
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: bookmarked ? "rgba(255, 215, 0, 0.25)" : "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)", border: bookmarked ? "1.5px solid #ffd700" : "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Bookmark size={26} fill={bookmarked ? "#ffd700" : "none"} color={bookmarked ? "#ffd700" : "white"} />
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
            Save
          </span>
        </button>

        {/* Share Button */}
        <button 
          onClick={handleShare}
          style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
          className="hover:scale-110 active:scale-90 transition-transform"
        >
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Share2 size={24} />
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
            Share
          </span>
        </button>
      </div>

      {/* Bottom Information Overlay */}
      <div style={{
        position: "absolute",
        bottom: "16px", left: "16px", right: "84px",
        display: "flex", flexDirection: "column", gap: "10px",
        color: "white", zIndex: 20,
        textShadow: "0 2px 6px rgba(0,0,0,0.9)"
      }}>
        {/* Author Details */}
        <Link href={`/profile/${short.author.id}`} style={{ textDecoration: "none", color: "white", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "46px", height: "46px", borderRadius: "50%",
            border: "2.5px solid var(--color-primary)", overflow: "hidden",
            boxShadow: "0 0 14px rgba(29, 155, 240, 0.5)"
          }}>
            {short.author.avatar ? (
              <img src={short.author.avatar} alt={authorName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.2rem" }}>
                {authorName.charAt(0)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontWeight: 900, fontSize: "1.05rem" }}>{authorName}</span>
              {short.author.isVerified && <CheckCircle2 size={16} style={{ color: "var(--color-primary)", fill: "var(--color-primary)", stroke: "#000" }} />}
            </div>
            <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>{userHandle}</span>
          </div>
        </Link>

        {/* Video Caption */}
        <p style={{ margin: 0, fontSize: "0.98rem", lineHeight: 1.4, fontWeight: 500, textShadow: "0 2px 4px rgba(0,0,0,0.9)" }}>
          {short.title}
        </p>

        {/* Audio Track & Spinning Vinyl Disc */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", opacity: 0.9, background: "rgba(0,0,0,0.5)", padding: "4px 12px", borderRadius: "99px", backdropFilter: "blur(6px)" }}>
            <Music2 size={14} className="animate-spin" />
            <span>{short.audioTitle || `Original Sound - ${authorName}`}</span>
          </div>
        </div>
      </div>

      {/* Live Video Seek Progress Bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", backgroundColor: "rgba(255,255,255,0.2)", zIndex: 25 }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, var(--color-primary), #ec4899)", transition: "width 0.1s linear" }} />
      </div>

      {/* Slide-Up Interactive Comments Drawer */}
      {showComments && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }} onClick={() => setShowComments(false)} />
          <div className="glass animate-slide-up" style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "60vh", maxHeight: "500px",
            backgroundColor: "var(--color-bg-surface)",
            borderTopLeftRadius: "28px", borderTopRightRadius: "28px",
            borderTop: "1px solid var(--color-border)",
            zIndex: 101, display: "flex", flexDirection: "column",
            boxShadow: "0 -20px 50px rgba(0,0,0,0.8)", padding: "20px"
          }}>
            {/* Drawer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--color-text-main)" }}>
                Comments ({commentsCount})
              </span>
              <button onClick={() => setShowComments(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                <X size={22} />
              </button>
            </div>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 0", display: "flex", flexDirection: "column", gap: "14px" }}>
              {commentsList.map(c => (
                <div key={c.id} style={{ display: "flex", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                    {c.user.charAt(0)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--color-text-main)" }}>{c.user}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{c.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-main)" }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} style={{ display: "flex", gap: "10px", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: "99px",
                  border: "1px solid var(--color-border)", background: "var(--color-bg-base)",
                  color: "var(--color-text-main)", fontSize: "0.95rem", outline: "none"
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                style={{
                  padding: "10px 18px", borderRadius: "99px",
                  background: newComment.trim() ? "var(--color-primary)" : "var(--color-border)",
                  color: "white", border: "none", fontWeight: 800, cursor: newComment.trim() ? "pointer" : "default"
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
