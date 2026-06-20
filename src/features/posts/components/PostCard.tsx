"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Edit2, Trash2, Check, X, Repeat, EyeOff, Send, 
  ExternalLink, Bookmark as BookmarkIcon, VolumeX, Ban, BarChart3, Pin, Zap, Star, ListPlus, 
  Settings2, Code, ShieldAlert, Flag, Eye, PenTool, UserPlus 
} from "lucide-react";
import styles from "./PostCard.module.css";

interface Comment {
  id: string;
  content: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    avatar?: string | null;
  };
  likes?: { userId: string }[];
}

interface Like {
  userId: string;
  postId: string;
}

interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  linkUrl?: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    avatar?: string | null;
  };
  likes?: Like[];
  bookmarkedBy?: { userId: string }[];
  comments?: Comment[];
  repost?: Post | null;
  views?: number;
  _count?: {
    likes: number;
    comments: number;
  };
}


export function PostCard({ post, currentUserId, isPrivacyPage }: { post: Post, currentUserId?: string, isPrivacyPage?: boolean }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  
  // Interaction states
  const initialLiked = post.likes?.some(l => l.userId === currentUserId) || false;
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? post.likes?.length ?? 0);

  const initialBookmarked = post.bookmarkedBy?.some(b => b.userId === currentUserId) || false;
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [views, setViews] = useState(post.views || 0);
  const isAuthor = currentUserId === post.author.id;

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentCount, setCommentCount] = useState(post._count?.comments ?? post.comments?.length ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View tracking
  useEffect(() => {
    const trackView = async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/view`, { method: "POST" });
        if (res.ok) {
          // Optimistically increment locally if not author
          if (!isAuthor) setViews(v => v + 1);
        }
      } catch (e) {}
    };
    
    // Use a small delay to avoid accidental scrolls
    const timer = setTimeout(trackView, 2000);
    return () => clearTimeout(timer);
  }, [post.id, isAuthor]);

  const handleShare = async () => {
    const url = `${window.location.origin}/feed?postId=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Post link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  // Repost & Quote states
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showQuoteInput, setShowQuoteInput] = useState(false);
  const [quoteText, setQuoteText] = useState("");

  // Comment management states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);



  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    
    // First, handle links/hashtags as before, but keep the structure
    const parts = content.split(/(\s+)/);
    
    return parts.map((part, i) => {
      // Process bold/italic within each part (simple implementation)
      let element: React.ReactNode = part;
      
      // Handle Bold **text**
      if (typeof element === "string" && element.includes("**")) {
        const boldParts = element.split(/(\*\*.*?\*\*)/);
        element = boldParts.map((bp, j) => {
          if (bp.startsWith("**") && bp.endsWith("**")) {
            return <strong key={j}>{bp.slice(2, -2)}</strong>;
          }
          return bp;
        });
      }

      // Handle Italic *text*
      if (typeof element === "string" && element.includes("*")) {
        const italicParts = element.split(/(\*.*?\*)/);
        element = italicParts.map((ip, j) => {
          if (ip.startsWith("*") && ip.endsWith("*") && !ip.startsWith("**")) {
            return <em key={j}>{ip.slice(1, -1)}</em>;
          }
          return ip;
        });
      }

      // Handle Hashtags
      if (part.startsWith("#") && part.length > 1) {
        const tag = part.substring(1).replace(/[.,!?;:]$/, "");
        return <Link key={i} href={`/hashtag/${tag}`} style={{ color: "var(--color-primary)", fontWeight: 600 }}>{part}</Link>;
      }
      
      // Handle URLs
      if (part.startsWith("http") || part.startsWith("https")) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>{part}</a>;
      }
      
      return <span key={i}>{element}</span>;
    });
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });


  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    console.log("Delete button clicked for post:", post.id);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      if (res.ok) {
        router.refresh();
        // Use a faster way to update UI if possible, but refresh + reload is safe
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Delete error:", e);
      alert("An error occurred. Check console.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleEditSave = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    try {
      await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    } catch (e) {
      console.error(e);
      setIsLiked(isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  const handleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
    try {
      await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
    } catch (e) {
      console.error(e);
      setIsBookmarked(isBookmarked);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        setCommentCount(prev => prev - 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentEditSave = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editCommentText })
      });
      if (res.ok) {
        setComments(comments.map(c => c.id === commentId ? { ...c, content: editCommentText } : c));
        setEditingCommentId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockUser = async (targetUserId: string, targetUserName: string) => {
    if (!confirm(`Are you sure you want to block @${targetUserName}?`)) return;
    try {
      const res = await fetch(`/api/users/${targetUserId}/block`, { method: "POST" });
      if (res.ok) {
        alert(`${targetUserName} has been blocked.`);
        // Optional: Hide all posts from this user in the current feed
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMute = async () => {
    try {
      const res = await fetch(`/api/users/${post.author.id}/mute`, { method: "POST" });
      if (res.ok) {
        alert("User muted!");
        setShowMenu(false);
        router.refresh();
      }
    } catch (e) { console.error(e); }
  };

  const handleBlock = async () => {
    if (!confirm("Are you sure you want to block this user?")) return;
    try {
      const res = await fetch(`/api/users/${post.author.id}/block`, { method: "POST" });
      if (res.ok) {
        alert("User blocked!");
        setShowMenu(false);
        router.refresh();
      }
    } catch (e) { console.error(e); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data.comment]);
        setCommentText("");
        setCommentCount(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepost = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/repost`, { method: "POST" });
      if (res.ok) {
        alert("Reposted!");
        setShowRepostMenu(false);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuote = async () => {
    if (!quoteText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/repost`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: quoteText })
      });
      if (res.ok) {
        alert("Quote posted!");
        setShowQuoteInput(false);
        setQuoteText("");
        setShowRepostMenu(false);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
      if (res.ok) {
        setComments(comments.map(c => {
          if (c.id === commentId) {
            const hasLiked = c.likes?.some(l => l.userId === currentUserId);
            return {
              ...c,
              likes: hasLiked 
                ? c.likes?.filter(l => l.userId !== currentUserId) 
                : [...(c.likes || []), { userId: currentUserId! }]
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentRepost = async (comment: Comment) => {
    if (!confirm("Repost this comment?")) return;
    try {
      const res = await fetch(`/api/posts`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Replying to @${comment.user.name}:\n"${comment.content}"` })
      });
      if (res.ok) {
        alert("Comment reposted!");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleHide = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/hide`, { method: "POST" });
      if (res.ok) {
        setIsHidden(true);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnhide = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/hide`, { method: "POST" }); // Toggle
      if (res.ok) {
        setIsHidden(true); // Effectively removes from view
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };




  if (isHidden) return null;

  return (
    <div className={`glass ${styles.card} animate-scale-in`}>
      {post.repost && (
        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", paddingLeft: "12px" }}>
          <Repeat size={14} /> Reposted
        </div>
      )}
      
      <div className={styles.header}>
        <Link href={`/profile/${post.author.id}`} className={styles.avatar}>
          {post.author.avatar ? (
             <img src={post.author.avatar} alt={post.author.name || ""} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          ) : getInitials(post.author.name)}
        </Link>
        <div className={styles.authorInfo}>
          <Link href={`/profile/${post.author.id}`} className={styles.authorName} style={{ textDecoration: "none" }}>
            {post.author.name || "Unknown User"}
          </Link>
          <span className="text-muted" style={{ fontSize: "0.85rem" }} suppressHydrationWarning>{formattedDate}</span>
        </div>
        
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "8px" }}
          >
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div className="glass animate-scale-in responsive-dropdown-menu" style={{
              position: "absolute", right: 0, top: "100%", zIndex: 100,
              display: "flex", flexDirection: "column", minWidth: "240px",
              padding: "var(--space-2)", borderRadius: "var(--radius-md)", gap: "var(--space-1)",
              border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)",
              background: "var(--color-bg-surface)"
            }}>
              {isAuthor ? (
                <>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setShowDeleteConfirm(true);
                      setShowMenu(false); 
                    }} 
                    style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left", width: "100%" }} 
                    className="hover-bg"
                  >
                    <Trash2 size={18} /> <span style={{ fontWeight: 600 }}>Delete</span>
                  </button>

                  {showDeleteConfirm && (
                    <div style={{
                      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
                      justifyContent: "center", zIndex: 1000, padding: "20px"
                    }} onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>
                      <div className="glass animate-scale-in" style={{
                        width: "100%", maxWidth: "320px", padding: "24px",
                        borderRadius: "20px", background: "var(--color-bg-base)",
                        boxShadow: "var(--shadow-xl)", border: "1px solid var(--color-border)"
                      }} onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-h3" style={{ marginBottom: "12px" }}>Delete Post?</h3>
                        <p className="text-muted" style={{ marginBottom: "24px", fontSize: "0.95rem" }}>
                          This can’t be undone and it will be removed from your profile and the timeline.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <button 
                            onClick={handleDelete}
                            style={{ 
                              padding: "12px", borderRadius: "var(--radius-full)", 
                              background: "#ff4d4d", color: "white", fontWeight: 700, 
                              border: "none", cursor: "pointer" 
                            }}
                          >
                            Delete
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            style={{ 
                              padding: "12px", borderRadius: "var(--radius-full)", 
                              background: "transparent", color: "var(--color-text-main)", 
                              fontWeight: 700, border: "1px solid var(--color-border)", cursor: "pointer" 
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <button onClick={() => alert("Boosted!")} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="hover-bg">
                    <Zap size={18} /> <span style={{ fontWeight: 600 }}>Boost</span>
                  </button>
                  <button onClick={() => alert("Pinned!")} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="hover-bg">
                    <Pin size={18} /> <span style={{ fontWeight: 600 }}>Pin to your profile</span>
                  </button>
                  <button onClick={() => alert("Highlighted!")} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="hover-bg">
                    <Star size={18} /> <span style={{ fontWeight: 600 }}>Highlight on your profile</span>
                  </button>
                  <button onClick={() => alert("Added to list")} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="hover-bg">
                    <ListPlus size={18} /> <span style={{ fontWeight: 600 }}>Add/remove from Lists</span>
                  </button>
                  <button onClick={() => setShowMenu(false)} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="hover-bg">
                    <BarChart3 size={18} /> <span style={{ fontWeight: 600 }}>View post analytics</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={async () => {
                      try {
                        await fetch(`/api/users/${post.author.id}/follow`, { method: "POST" });
                        alert(`You are now following ${post.author.name}`);
                        router.refresh();
                      } catch (e) {}
                    }} 
                    style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} 
                    className="hover-bg"
                  >
                    <UserPlus size={18} /> <span style={{ fontWeight: 600 }}>Follow @{post.author.name}</span>
                  </button>
                  <button onClick={handleMute} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="hover-bg">
                    <VolumeX size={18} /> <span style={{ fontWeight: 600 }}>Mute @{post.author.name}</span>
                  </button>
                  <button onClick={handleHide} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="hover-bg">
                    <EyeOff size={18} /> <span style={{ fontWeight: 600 }}>Hide this post</span>
                  </button>
                  <button onClick={handleBlock} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="hover-bg">
                    <Ban size={18} /> <span style={{ fontWeight: 600 }}>Block @{post.author.name}</span>
                  </button>
                  <button onClick={() => alert("Reported")} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="hover-bg">
                    <Flag size={18} /> <span style={{ fontWeight: 600 }}>Report post</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.content}>
        {isEditing ? (
          <div className="animate-scale-in" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: "100%", minHeight: "100px", backgroundColor: "rgba(0,0,0,0.02)",
                color: "var(--color-text-main)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)", padding: "12px", resize: "none", outline: "none"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setIsEditing(false)} style={{ padding: "8px 16px", borderRadius: "var(--radius-full)", background: "rgba(0,0,0,0.05)", color: "var(--color-text-main)", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleEditSave} style={{ padding: "8px 16px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", color: "white", fontWeight: 600 }}>
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="animate-fade-in" style={{ fontSize: "1.05rem", padding: "4px 0" }}>
              {renderContent(post.content)}
            </div>
            
            {post.repost && (
              <div className="animate-fade-in" style={{ border: "1px solid var(--color-border)", padding: "16px", borderRadius: "var(--radius-lg)", marginTop: "12px", background: "rgba(0,0,0,0.01)" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--color-primary)", color: "white", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {post.repost.author.avatar ? (
                        <img src={post.repost.author.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : getInitials(post.repost.author.name)}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{post.repost.author.name}</div>
                 </div>
                 <div style={{ fontSize: "0.95rem" }}>{renderContent(post.repost.content)}</div>
              </div>
            )}

            {post.imageUrl && (
              <div style={{ marginTop: "12px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                <img src={post.imageUrl} alt="Post image" style={{ width: "100%", display: "block", maxHeight: "500px", objectFit: "cover" }} />
              </div>
            )}

            {post.videoUrl && (
              <div style={{ marginTop: "12px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)", background: "black" }}>
                <video src={post.videoUrl} controls style={{ width: "100%", maxHeight: "500px" }} />
              </div>
            )}
          </>
        )}
      </div>

      {showQuoteInput && (
        <div className="animate-slide-up" style={{ padding: "16px", border: "1px solid var(--color-primary-light)", borderRadius: "var(--radius-lg)", marginTop: "12px", background: "rgba(29, 155, 240, 0.02)" }}>
          <textarea 
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder="Add your comment..."
            style={{
              width: "100%", minHeight: "80px", backgroundColor: "transparent",
              color: "var(--color-text-main)", border: "none", outline: "none",
              resize: "none", marginBottom: "12px", fontSize: "1rem"
            }}
            autoFocus
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button onClick={() => setShowQuoteInput(false)} style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>Cancel</button>
            <button onClick={handleQuote} disabled={isSubmitting || !quoteText.trim()} style={{ 
              background: "var(--color-primary)", color: "white", padding: "8px 24px", 
              borderRadius: "var(--radius-full)", fontWeight: 600, opacity: (!quoteText.trim() || isSubmitting) ? 0.5 : 1 
            }}>Quote Post</button>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button 
          className={`${styles.actionBtn} ${styles.likeBtn} ${isLiked ? styles.activeLike : ""}`} 
          onClick={handleLike}
        >
          <Heart size={22} fill={isLiked ? "#f91880" : "none"} stroke={isLiked ? "#f91880" : "currentColor"} />
          <span className={styles.actionText}>{likeCount || "Like"}</span>
        </button>

        <button 
          className={`${styles.actionBtn} ${styles.replyBtn} ${showComments ? styles.activeReply : ""}`} 
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle size={22} fill={showComments ? "var(--color-primary)" : "none"} />
          <span className={styles.actionText}>{commentCount || "Reply"}</span>
        </button>
        
        <div style={{ position: "relative" }}>
          <button 
            className={`${styles.actionBtn} ${styles.repostBtn} ${post.repost ? styles.activeRepost : ""}`} 
            onClick={() => setShowRepostMenu(!showRepostMenu)}
          >
            <Repeat size={22} />
            <span className={styles.actionText}>Repost</span>
          </button>
          
          {showRepostMenu && (
            <div className="glass animate-scale-in" style={{
              position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "100%", zIndex: 10,
              display: "flex", flexDirection: "column", minWidth: "150px",
              padding: "var(--space-2)", borderRadius: "var(--radius-md)", gap: "var(--space-1)",
              marginBottom: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)"
            }}>
              <button 
                onClick={() => { handleRepost(); }}
                style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "10px", borderRadius: "var(--radius-sm)", textAlign: "left" }}
                className="hover-bg"
              >
                <Repeat size={18} style={{ color: "#00ba7c" }} /> Repost
              </button>
              <button 
                onClick={() => { setShowQuoteInput(true); setShowRepostMenu(false); }}
                style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "10px", borderRadius: "var(--radius-sm)", textAlign: "left" }}
                className="hover-bg"
              >
                <Edit2 size={18} style={{ color: "var(--color-primary)" }} /> Quote
              </button>
            </div>
          )}
        </div>

        <button 
          className={`${styles.actionBtn} ${styles.bookmarkBtn} ${isBookmarked ? styles.activeBookmark : ""}`} 
          onClick={handleBookmark}
        >
          <BookmarkIcon size={22} fill={isBookmarked ? "var(--color-primary)" : "none"} />
        </button>

        <button className={`${styles.actionBtn} ${styles.shareBtn}`} onClick={handleShare}>
          <Share2 size={22} />
        </button>

        <div className={styles.actionBtn} style={{ cursor: "default" }}>
          <BarChart3 size={20} />
          <span className={styles.actionText}>{views}</span>
        </div>
      </div>

      {showComments && (
        <div className="animate-slide-up" style={{ marginTop: "16px", borderTop: "1px solid var(--color-border)", paddingTop: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {comments.map(comment => {
              const commentLiked = comment.likes?.some(l => l.userId === currentUserId);
              const isCommentAuthor = currentUserId === comment.userId;
              const canDeleteComment = isCommentAuthor || isAuthor;

              return (
                <div key={comment.id} className="animate-fade-in" style={{ display: "flex", gap: "12px", position: "relative" }}>
                  <Link href={`/profile/${comment.userId}`} style={{ flexShrink: 0 }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, overflow: "hidden" }}>
                      {comment.user.avatar ? (
                        <img src={comment.user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : getInitials(comment.user?.name)}
                    </div>
                  </Link>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Link href={`/profile/${comment.userId}`} style={{ color: "var(--color-text-main)", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" }}>
                          {comment.user?.name || "Unknown"}
                        </Link>
                      </div>
                      
                      <div style={{ position: "relative" }}>
                        <button 
                          onClick={() => setCommentMenuId(commentMenuId === comment.id ? null : comment.id)}
                          style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {commentMenuId === comment.id && (
                          <div className="glass animate-scale-in responsive-dropdown-menu" style={{
                            position: "absolute", right: 0, top: "100%", zIndex: 100,
                            display: "flex", flexDirection: "column", minWidth: "180px",
                            padding: "6px", borderRadius: "12px", border: "1px solid var(--color-border)",
                            background: "var(--color-bg-surface)", boxShadow: "var(--shadow-lg)"
                          }}>
                            {isCommentAuthor && (
                              <button onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); setCommentMenuId(null); }} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "10px", borderRadius: "8px", textAlign: "left" }} className="hover-bg">
                                <Edit2 size={14} /> Edit
                              </button>
                            )}
                            {canDeleteComment && (
                              <button onClick={() => { handleCommentDelete(comment.id); setCommentMenuId(null); }} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", padding: "10px", borderRadius: "8px", textAlign: "left" }} className="hover-bg">
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                            {!isCommentAuthor && (
                              <button onClick={() => { handleBlockUser(comment.userId, comment.user?.name || "User"); setCommentMenuId(null); }} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", padding: "10px", borderRadius: "8px", textAlign: "left" }} className="hover-bg">
                                <Ban size={14} /> Block @{comment.user?.name}
                              </button>
                            )}
                            <button onClick={() => setCommentMenuId(null)} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "10px", borderRadius: "8px", textAlign: "left" }} className="hover-bg">
                              <X size={14} /> Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingCommentId === comment.id ? (
                      <div style={{ marginTop: "8px" }}>
                        <textarea 
                          value={editCommentText}
                          onChange={e => setEditCommentText(e.target.value)}
                          style={{
                            width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--color-border)",
                            background: "rgba(0,0,0,0.02)", color: "var(--color-text-main)", resize: "none"
                          }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                          <button onClick={() => setEditingCommentId(null)} style={{ padding: "4px 12px", borderRadius: "var(--radius-full)", background: "none", border: "1px solid var(--color-border)", color: "var(--color-text-main)", fontSize: "0.85rem" }}>Cancel</button>
                          <button onClick={() => handleCommentEditSave(comment.id)} style={{ padding: "4px 12px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", color: "white", border: "none", fontSize: "0.85rem", fontWeight: 600 }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: "var(--color-text-main)", marginTop: "4px", fontSize: "0.95rem", lineHeight: 1.4 }}>{renderContent(comment.content)}</p>
                    )}

                    <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
                      <button onClick={() => handleCommentLike(comment.id)} style={{ display: "flex", alignItems: "center", gap: "6px", color: commentLiked ? "#f91880" : "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", transition: "color 0.2s" }}>
                        <Heart size={14} fill={commentLiked ? "#f91880" : "none"} /> {comment.likes?.length || ""}
                      </button>
                      <button onClick={() => handleCommentRepost(comment)} style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", transition: "color 0.2s" }}>
                        <Repeat size={14} /> Repost
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ display: "flex", gap: "12px", marginTop: "24px", alignItems: "flex-end", background: "rgba(0,0,0,0.02)", padding: "12px", borderRadius: "var(--radius-lg)" }}>
            <textarea 
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Post your reply"
              style={{
                flex: 1, padding: "8px 0", borderRadius: "0",
                border: "none", background: "transparent",
                color: "var(--color-text-main)", resize: "none", outline: "none", minHeight: "24px", maxHeight: "150px"
              }}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <button 
              onClick={handleComment}
              disabled={isSubmitting || !commentText.trim()}
              style={{
                padding: "8px", borderRadius: "50%", border: "none",
                background: "var(--color-primary)", color: "white", cursor: "pointer",
                opacity: (!commentText.trim() || isSubmitting) ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", transition: "all 0.2s"
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
