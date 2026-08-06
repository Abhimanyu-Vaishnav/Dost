"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Heart, MessageCircle, Share2, Repeat, Bookmark as BookmarkIcon, 
  BarChart3, Image as ImageIcon, Smile, FileCode, Check, Send, Sparkles, MoreHorizontal,
  Video, ListFilter, X, CheckCircle2, ShieldCheck, Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostCard } from "@/features/posts/components/PostCard";
import { uploadMediaFile } from "@/lib/upload";
import styles from "@/features/posts/components/PostCard.module.css";

const POPULAR_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6cWJndm4yM2pvdDZtbXQ5aGtmb2pvdjVuc2xrdHRlZjE4YWhwayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlHFRbmaZtBRhXG/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtlMnZkZW85eWRvYmRsYnpvZzJpd2k1N3FnMnV1cWp2ZnlsNDB6ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3JldTNtcmpsOGxid20wc2t6MXZ4NHpxbDZkbXh1OHdwdmx3eHZ6YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l1J9EdzfOSgfyueLm/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z0bjJ6MndsdHJqNGNxbDZqZDRkYzNmNHk3amptdmthdmFzbWNxeiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26u4cqiYI30juCOGY/giphy.gif"
];

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [postId, setPostId] = useState<string>("");
  const [postData, setPostData] = useState<any>(null);
  const [ancestors, setAncestors] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unpack params safely for both Promise and direct Object formats
  useEffect(() => {
    if (!params) return;
    if (typeof (params as any).then === "function") {
      (params as Promise<{ id: string }>).then(p => {
        if (p && p.id) setPostId(p.id);
      });
    } else if ((params as any)?.id) {
      setPostId((params as any).id);
    }
  }, [params]);

  // Reply creation state
  const [replyText, setReplyText] = useState("");
  const [replyImageUrl, setReplyImageUrl] = useState<string | null>(null);
  const [replyVideoUrl, setReplyVideoUrl] = useState<string | null>(null);
  const [replyGifUrl, setReplyGifUrl] = useState<string | null>(null);
  const [isCodeBlock, setIsCodeBlock] = useState(false);
  const [showPollUI, setShowPollUI] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    // Fetch current user info
    fetch("/api/users/profile")
      .then(res => res.json())
      .then(data => { if (data.user) setCurrentUser(data.user); })
      .catch(() => {});

    // Fetch post thread detail
    fetch(`/api/posts/${postId}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok || !data.post) throw new Error(data.error || "Post not found");
        return data;
      })
      .then(data => {
        setPostData(data.post);
        setAncestors(data.ancestors || []);
        setReplies(data.replies || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadMediaFile(file);
      if (file.type.startsWith("image/")) {
        setReplyImageUrl(url);
        setReplyVideoUrl(null);
      } else if (file.type.startsWith("video/")) {
        setReplyVideoUrl(url);
        setReplyImageUrl(null);
      }
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !replyImageUrl && !replyVideoUrl && !replyGifUrl) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const pollDataPayload = showPollUI && pollOptions.filter(o => o.trim()).length >= 2
        ? { question: replyText || "Poll", options: pollOptions.filter(o => o.trim()).map((opt, i) => ({ id: i + 1, text: opt, votes: [] })) }
        : null;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          parentId: postId,
          imageUrl: replyImageUrl,
          videoUrl: replyVideoUrl,
          gifUrl: replyGifUrl,
          isCodeBlock,
          pollData: pollDataPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReplies(prev => [data.post, ...prev]);
        setReplyText("");
        setReplyImageUrl(null);
        setReplyVideoUrl(null);
        setReplyGifUrl(null);
        setIsCodeBlock(false);
        setShowPollUI(false);
        setPollOptions(["", ""]);
        
        // Update main post reply count
        setPostData((prev: any) => ({
          ...prev,
          _count: {
            ...prev._count,
            replies: (prev._count?.replies || 0) + 1
          }
        }));
      }
    } catch (e) {
      console.error("Reply creation error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "1.1rem" }}>
          Loading post thread...
        </div>
      </AppLayout>
    );
  }

  if (error || !postData) {
    return (
      <AppLayout>
        <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <h2>Post not found</h2>
          <button 
            onClick={() => router.back()} 
            style={{ 
              marginTop: "16px", padding: "10px 24px", borderRadius: "9999px", 
              background: "var(--color-primary)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" 
            }}
          >
            Go Back
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: "600px", margin: "0 auto", borderRight: "1px solid var(--color-border)", borderLeft: "1px solid var(--color-border)", minHeight: "100vh", background: "var(--color-bg-base)" }}>
        
        {/* Sticky Header */}
        <div style={{ 
          position: "sticky", top: 0, zIndex: 20, background: "rgba(0,0,0,0.85)", 
          backdropFilter: "blur(12px)", padding: "14px 16px", display: "flex", 
          alignItems: "center", gap: "24px", borderBottom: "1px solid var(--color-border)" 
        }}>
          <button 
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--color-text-main)" }}>Post</h1>
          </div>
        </div>

        {/* Parent Thread Chain (Ancestors leading to this post) */}
        {ancestors.map((ancestorPost) => (
          <PostCard 
            key={ancestorPost.id} 
            post={ancestorPost} 
            currentUserId={currentUser?.id}
            isThreadParent={true}
            hasThreadChild={true}
          />
        ))}

        {/* Focused Target Post */}
        <div style={{ borderBottom: "1px solid var(--color-border)" }}>
          <PostCard 
            post={postData} 
            currentUserId={currentUser?.id}
            isThreadParent={replies.length > 0}
            hasThreadChild={false}
          />
        </div>

        {/* Inline X-Style "Post your reply" Composer Box */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", gap: "12px", background: "var(--color-bg-base)" }}>
          <div style={{ 
            width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-bg-surface)", 
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, overflow: "hidden" 
          }}>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              currentUser?.name?.charAt(0).toUpperCase() || "?"
            )}
          </div>

          <form onSubmit={handleCreateReply} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
            <textarea
              ref={textareaRef}
              placeholder="Post your reply"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              style={{ 
                width: "100%", background: "transparent", border: "none", color: "var(--color-text-main)", 
                fontSize: "1.05rem", outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.4 
              }}
            />

            {/* Upload previews */}
            {uploading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)", fontSize: "0.85rem" }}>
                <Loader2 size={16} className="animate-spin" /> Uploading media...
              </div>
            )}
            {replyImageUrl && (
              <div style={{ position: "relative", width: "fit-content", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                <img src={replyImageUrl} alt="Attachment" style={{ maxHeight: "200px", display: "block" }} />
                <button type="button" onClick={() => setReplyImageUrl(null)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", padding: 4 }}>
                  <X size={14} />
                </button>
              </div>
            )}
            {replyGifUrl && (
              <div style={{ position: "relative", width: "fit-content", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                <img src={replyGifUrl} alt="GIF" style={{ maxHeight: "200px", display: "block" }} />
                <button type="button" onClick={() => setReplyGifUrl(null)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", padding: 4 }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Poll creator UI */}
            {showPollUI && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)" }}>
                  <span>Create a Poll</span>
                  <button type="button" onClick={() => setShowPollUI(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[i] = e.target.value;
                      setPollOptions(updated);
                    }}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-main)", outline: "none" }}
                  />
                ))}
                {pollOptions.length < 4 && (
                  <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} style={{ color: "var(--color-primary)", background: "none", border: "none", textAlign: "left", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                    + Add option
                  </button>
                )}
              </div>
            )}

            {/* Action buttons bar & Reply submit button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", gap: "14px", color: "var(--color-primary)", alignItems: "center" }}>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileUpload} style={{ display: "none" }} />
                <span title="Media"><ImageIcon size={19} style={{ cursor: "pointer" }} onClick={() => fileInputRef.current?.click()} /></span>
                <span title="GIF" style={{ cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, padding: "1px 5px", border: "1px solid var(--color-primary)", borderRadius: "4px" }} onClick={() => setShowGifPicker(!showGifPicker)}>GIF</span>
                <span title="Poll"><ListFilter size={19} style={{ cursor: "pointer" }} onClick={() => setShowPollUI(!showPollUI)} /></span>
                <span title="Code block"><FileCode size={19} style={{ cursor: "pointer", color: isCodeBlock ? "var(--color-primary)" : "var(--color-text-muted)" }} onClick={() => setIsCodeBlock(!isCodeBlock)} /></span>
              </div>

              <button
                type="submit"
                disabled={(!replyText.trim() && !replyImageUrl && !replyVideoUrl && !replyGifUrl) || isSubmitting}
                style={{
                  padding: "8px 20px", borderRadius: "9999px", 
                  background: (replyText.trim() || replyImageUrl || replyVideoUrl || replyGifUrl) ? "var(--color-primary)" : "rgba(29, 155, 240, 0.4)",
                  color: "#fff", border: "none", fontWeight: 700, fontSize: "0.9rem", 
                  cursor: (replyText.trim() || replyImageUrl || replyVideoUrl || replyGifUrl) ? "pointer" : "not-allowed",
                  transition: "all 0.15s ease"
                }}
              >
                {isSubmitting ? "Replying..." : "Reply"}
              </button>
            </div>
          </form>
        </div>

        {/* GIF Picker Modal overlay */}
        {showGifPicker && (
          <div style={{ padding: "12px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
              <span>Select a GIF</span>
              <button type="button" onClick={() => setShowGifPicker(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}><X size={14} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {POPULAR_GIFS.map((gif, i) => (
                <img 
                  key={i} 
                  src={gif} 
                  alt="GIF option" 
                  onClick={() => { setReplyGifUrl(gif); setShowGifPicker(false); }}
                  style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Sort Filter Bar */}
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ cursor: "pointer", fontWeight: 600 }}>Relevant ▾</div>
          <div style={{ cursor: "pointer", color: "var(--color-primary)" }}>View quotes &gt;</div>
        </div>

        {/* Connected Replies List (Rendered as full PostCards) */}
        <div>
          {replies.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              No replies yet. Be the first to reply!
            </div>
          ) : (
            replies.map((replyPost) => (
              <div key={replyPost.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <PostCard 
                  post={replyPost} 
                  currentUserId={currentUser?.id}
                  isThreadParent={Boolean(replyPost.replies && replyPost.replies.length > 0)}
                  hasThreadChild={true}
                />
                
                {/* Render 2nd-level replies nested below */}
                {replyPost.replies && replyPost.replies.map((subReply: any) => (
                  <div key={subReply.id} style={{ paddingLeft: "36px", background: "rgba(255, 255, 255, 0.015)", borderTop: "1px solid rgba(255, 255, 255, 0.03)" }}>
                    <PostCard 
                      post={subReply} 
                      currentUserId={currentUser?.id}
                      hasThreadChild={true}
                    />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

      </div>
    </AppLayout>
  );
}
