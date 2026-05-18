"use client";

import { useState, useRef } from "react";
import { X, Camera, Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditProfileModalProps {
  user: {
    name: string | null;
    bio: string | null;
    avatar: string | null;
    coverImage: string | null;
  };
  onClose: () => void;
}

export function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [coverImage, setCoverImage] = useState(user.coverImage || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === "avatar") setAvatar(base64);
      else setCoverImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, avatar, coverImage }),
      });

      if (res.ok) {
        onClose();
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1100, backdropFilter: "blur(8px)"
    }} onClick={onClose}>
      <div className="glass animate-scale-in" style={{
        width: "100%", maxWidth: "600px", padding: "0", borderRadius: "24px",
        display: "flex", flexDirection: "column", border: "1px solid var(--color-border)",
        maxHeight: "90vh", overflowY: "auto", background: "white"
      }} onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={onClose} style={{ color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
            <h2 className="text-h3" style={{ fontSize: "1.25rem" }}>Edit Profile</h2>
          </div>
          <button 
            onClick={handleSave} 
            disabled={loading || !name.trim()}
            style={{
              padding: "8px 20px", borderRadius: "var(--radius-full)",
              background: "var(--color-text-main)", color: "white", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "8px", opacity: (loading || !name.trim()) ? 0.7 : 1,
              border: "none", cursor: "pointer"
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Save"}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Cover Edit */}
          <div style={{ position: "relative", height: "180px", background: "var(--color-primary-light)" }}>
             {coverImage && <img src={coverImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
             <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button 
                  onClick={() => coverInputRef.current?.click()}
                  style={{ width: "45px", height: "45px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
                >
                  <Camera size={24} />
                </button>
             </div>
             <input type="file" ref={coverInputRef} onChange={e => handleFileChange(e, "cover")} accept="image/*" style={{ display: "none" }} />
          </div>

          {/* Avatar Edit */}
          <div style={{ padding: "0 24px", position: "relative" }}>
             <div style={{ 
               width: "120px", height: "120px", borderRadius: "50%", border: "4px solid white",
               background: "var(--color-primary)", marginTop: "-60px", overflow: "hidden", position: "relative"
             }}>
                {avatar && <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
                  >
                    <Camera size={20} />
                  </button>
                </div>
                <input type="file" ref={avatarInputRef} onChange={e => handleFileChange(e, "avatar")} accept="image/*" style={{ display: "none" }} />
             </div>
          </div>

          {/* Form Fields */}
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-muted)" }}>Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-border)",
                  background: "transparent", color: "var(--color-text-main)", outline: "none", fontSize: "1.1rem"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-muted)" }}>Bio</label>
              <textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                style={{
                  width: "100%", minHeight: "120px", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-border)",
                  background: "transparent", color: "var(--color-text-main)", outline: "none", resize: "none", fontSize: "1.1rem"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
