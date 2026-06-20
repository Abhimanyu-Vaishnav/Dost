"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Image as ImageIcon, Send, Video, Link as LinkIcon, X, Loader2, 
  Smile, Calendar, MapPin, ListFilter, FileType, MoreHorizontal
} from "lucide-react";

interface CreatePostProps {
  userName: string;
  userAvatar?: string | null;
  onPostSuccess?: () => void;
}

export function CreatePost({ userName, userAvatar, onPostSuccess }: CreatePostProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState<"image" | "video" | "link" | "imageUrl" | "imageOptions" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (file.type.startsWith("image/")) {
        setImageUrl(base64);
        setShowMediaInput("image");
      } else if (file.type.startsWith("video/")) {
        setVideoUrl(base64);
        setShowMediaInput("video");
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl && !videoUrl) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl, videoUrl, linkUrl }),
      });

      if (!res.ok) throw new Error("Failed to post");

      setContent("");
      setImageUrl("");
      setVideoUrl("");
      setLinkUrl("");
      setShowMediaInput(null);
      router.refresh(); 
      if (onPostSuccess) onPostSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMarker = (marker: string) => {
    setContent(prev => prev + marker);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      padding: "16px",
      borderRadius: "0",
      borderBottom: "1px solid var(--color-border)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      background: "transparent"
    }}>
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Avatar */}
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          backgroundColor: "var(--color-primary)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0,
          fontSize: "1.2rem", overflow: "hidden"
        }}>
          {userAvatar ? (
            <img src={userAvatar} alt="Me" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            userName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Input Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's happening?`}
            disabled={isSubmitting}
            style={{
              width: "100%", border: "none", resize: "none", backgroundColor: "transparent",
              color: "var(--color-text-main)", fontSize: "1.25rem", outline: "none",
              minHeight: "50px", paddingTop: "8px", fontWeight: 400, fontFamily: "inherit"
            }}
          />

          {/* Media Previews */}
          {(imageUrl || videoUrl || linkUrl || showMediaInput === "link" || showMediaInput === "imageUrl" || showMediaInput === "imageOptions") && (
            <div className="animate-slide-up" style={{ marginTop: "12px", borderRadius: "16px", position: "relative", overflow: "hidden", border: "1px solid var(--color-border)" }}>
              <button 
                type="button" 
                onClick={() => {
                  setImageUrl("");
                  setVideoUrl("");
                  setLinkUrl("");
                  setShowMediaInput(null);
                }}
                style={{ position: "absolute", right: "12px", top: "12px", color: "white", background: "rgba(15, 20, 25, 0.75)", borderRadius: "50%", padding: "6px", zIndex: 1 }}
              >
                <X size={18} />
              </button>
              
              {imageUrl && (
                <img src={imageUrl} style={{ width: "100%", maxHeight: "500px", objectFit: "cover" }} alt="Preview" />
              )}
              
              {videoUrl && (
                <video src={videoUrl} controls style={{ width: "100%", maxHeight: "500px" }} />
              )}

              {showMediaInput === "link" && (
                <div style={{ padding: "16px", background: "var(--color-bg-surface)" }}>
                  <input 
                    type="text"
                    placeholder="Paste link URL here..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)",
                      background: "var(--color-bg-base)", color: "var(--color-text-main)", outline: "none"
                    }}
                    autoFocus
                  />
                </div>
              )}

              {showMediaInput === "imageUrl" && (
                <div style={{ padding: "16px", background: "var(--color-bg-surface)" }}>
                  <input 
                    type="text"
                    placeholder="Paste image URL here..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)",
                      background: "var(--color-bg-base)", color: "var(--color-text-main)", outline: "none"
                    }}
                    autoFocus
                  />
                </div>
              )}

              {showMediaInput === "imageOptions" && (
                <div style={{ padding: "16px", background: "var(--color-bg-surface)", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-main)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
                      <ImageIcon size={18} /> Upload Image / Video
                    </button>
                    <button type="button" onClick={() => setShowMediaInput("imageUrl")} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-main)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
                      <LinkIcon size={18} /> Paste Image URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Icons and Post Button Row */}
          <div style={{ 
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: "12px", paddingTop: "12px"
          }}>
            <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
              <button type="button" onClick={() => setShowMediaInput("imageOptions")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Image / Video Options"><ImageIcon size={20} /></button>
              <button type="button" onClick={() => setShowMediaInput("link")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Add Link"><LinkIcon size={20} /></button>
              <button type="button" onClick={() => alert("Poll coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Add Poll"><ListFilter size={20} /></button>
              <button type="button" onClick={() => alert("Emoji picker coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle" title="Add Emoji"><Smile size={20} /></button>
              
              {/* Extra icons hidden on mobile, shown on desktop */}
              <button type="button" onClick={() => alert("GIF coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle create-post-extra-icon" title="GIF"><FileType size={20} /></button>
              <button type="button" onClick={() => alert("Scheduling coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle create-post-extra-icon" title="Schedule"><Calendar size={20} /></button>
              <button type="button" onClick={() => alert("Location coming soon!")} style={{ padding: "8px", color: "var(--color-primary)" }} className="hover-bg-circle create-post-extra-icon" title="Location"><MapPin size={20} /></button>
              
              <div className="create-post-extra-icon" style={{ width: "1px", background: "var(--color-border)", margin: "0 8px", height: "20px" }}></div>
              
              <button type="button" onClick={() => addMarker("**")} style={{ padding: "8px", color: "var(--color-text-main)", fontWeight: 800 }} className="hover-bg-circle create-post-extra-icon" title="Bold">B</button>
              <button type="button" onClick={() => addMarker("*")} style={{ padding: "8px", color: "var(--color-text-main)", fontStyle: "italic" }} className="hover-bg-circle create-post-extra-icon" title="Italic">I</button>

              {/* More options button (shown on mobile only) */}
              <div style={{ position: "relative", display: "flex", alignItems: "center" }} className="create-post-more-btn">
                <button 
                  type="button" 
                  onClick={() => setShowMoreMenu(!showMoreMenu)} 
                  style={{ padding: "8px", color: "var(--color-primary)" }} 
                  className="hover-bg-circle" 
                  title="More Options"
                >
                  <MoreHorizontal size={20} />
                </button>
                
                {showMoreMenu && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setShowMoreMenu(false)} />
                    <div className="glass animate-scale-in responsive-dropdown-menu" style={{
                      position: "absolute", left: 0, top: "100%", zIndex: 100,
                      display: "flex", flexDirection: "column", minWidth: "180px",
                      padding: "8px", borderRadius: "16px", gap: "4px",
                      border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)",
                      background: "var(--color-bg-surface)", marginTop: "4px"
                    }}>
                      <button type="button" onClick={() => { alert("GIF coming soon!"); setShowMoreMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", color: "var(--color-text-main)", textAlign: "left", width: "100%", borderRadius: "8px" }} className="hover-bg">
                        <FileType size={18} color="var(--color-primary)" /> <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>GIF</span>
                      </button>
                      <button type="button" onClick={() => { alert("Scheduling coming soon!"); setShowMoreMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", color: "var(--color-text-main)", textAlign: "left", width: "100%", borderRadius: "8px" }} className="hover-bg">
                        <Calendar size={18} color="var(--color-primary)" /> <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Schedule</span>
                      </button>
                      <button type="button" onClick={() => { alert("Location coming soon!"); setShowMoreMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", color: "var(--color-text-main)", textAlign: "left", width: "100%", borderRadius: "8px" }} className="hover-bg">
                        <MapPin size={18} color="var(--color-primary)" /> <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Location</span>
                      </button>
                      
                      <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />
                      
                      <button type="button" onClick={() => { addMarker("**"); setShowMoreMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", color: "var(--color-text-main)", textAlign: "left", width: "100%", borderRadius: "8px" }} className="hover-bg">
                        <span style={{ fontWeight: 800, width: "18px", display: "inline-block", textAlign: "center" }}>B</span> <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Bold Text</span>
                      </button>
                      <button type="button" onClick={() => { addMarker("*"); setShowMoreMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", color: "var(--color-text-main)", textAlign: "left", width: "100%", borderRadius: "8px" }} className="hover-bg">
                        <span style={{ fontStyle: "italic", width: "18px", display: "inline-block", textAlign: "center" }}>I</span> <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Italic Text</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <button type="submit" disabled={isSubmitting || (!content.trim() && !imageUrl && !videoUrl)} style={{
              backgroundColor: "var(--color-text-main)", color: "var(--color-bg-base)",
              padding: "10px 24px", borderRadius: "var(--radius-full)",
              fontWeight: 800, fontSize: "1rem", border: "none", cursor: "pointer",
              opacity: (isSubmitting || (!content.trim() && !imageUrl && !videoUrl)) ? 0.5 : 1,
              transition: "all 0.2s"
            }}>
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Post"}
            </button>
          </div>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*,video/*" 
        style={{ display: "none" }} 
      />
    </form>
  );
}
