"use client";

import { useState, useRef } from "react";
import { X, Camera, Loader2, ZoomIn, ZoomOut, Move, Sparkles, Check, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditProfileModalProps {
  user: {
    name: string | null;
    username?: string | null;
    bio: string | null;
    avatar: string | null;
    coverImage: string | null;
    gender?: string | null;
    dob?: Date | string | null;
    accountType?: string | null;
    accountSubType?: string | null;
  };
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  { group: "Tech & Product", items: [
    { value: "software_developer", label: "💻 Software Developer" },
    { value: "ui_ux_designer", label: "🎨 UI/UX Designer" },
    { value: "tech_founder", label: "🚀 Tech Founder" },
    { value: "ai_researcher", label: "🤖 AI Researcher" },
    { value: "devops_engineer", label: "☁️ DevOps Engineer" },
  ]},
  { group: "Creators & Media", items: [
    { value: "digital_creator", label: "✨ Digital Creator" },
    { value: "influencer", label: "🌟 Influencer" },
    { value: "photographer", label: "📸 Photographer" },
    { value: "animator_3d", label: "🎬 3D Motion Artist" },
    { value: "musician_producer", label: "🎵 Musician / Producer" },
  ]},
  { group: "Business & Professional", items: [
    { value: "startup_company", label: "🏢 Tech Startup" },
    { value: "vc_investor", label: "💼 VC Investor" },
    { value: "fitness_trainer", label: "🏋️ Fitness Coach" },
    { value: "financial_analyst", label: "📊 Financial Analyst" },
    { value: "architect", label: "🏛️ Architect" },
    { value: "educator", label: "🎓 Educator / Teacher" },
  ]}
];

export function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [errorMsg, setErrorMsg] = useState("");
  
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [coverImage, setCoverImage] = useState(user.coverImage || "");
  
  // Image Adjustment Controls (Zoom & Position)
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarPosY, setAvatarPosY] = useState(50);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverPosY, setCoverPosY] = useState(50);

  const [gender, setGender] = useState(user.gender || "");
  const [dob, setDob] = useState(() => {
    if (!user.dob) return "";
    const d = new Date(user.dob);
    return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
  });
  
  const [accountType, setAccountType] = useState(user.accountType || "CREATOR");
  const [accountSubType, setAccountSubType] = useState(user.accountSubType || "software_developer");
  
  const [loading, setLoading] = useState(false);
  const [activeAdjustTarget, setActiveAdjustTarget] = useState<"avatar" | "cover" | null>(null);

  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === "avatar") {
        setAvatar(base64);
        setActiveAdjustTarget("avatar");
      } else {
        setCoverImage(base64);
        setActiveAdjustTarget("cover");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, bio, avatar, coverImage, gender, dob, accountType, accountSubType }),
      });

      const data = await res.json();
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setErrorMsg(data.error || "Failed to update profile");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error saving profile changes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, backdropFilter: "blur(12px)", padding: "16px"
      }} 
      onClick={onClose}
    >
      <div 
        className="glass animate-scale-in" 
        style={{
          width: "100%", maxWidth: "640px", padding: "0", borderRadius: "28px",
          display: "flex", flexDirection: "column", border: "1px solid var(--color-border)",
          maxHeight: "92vh", overflowY: "auto", background: "var(--color-bg-surface)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)"
        }} 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: "1px solid var(--color-border)",
          position: "sticky", top: 0, background: "var(--color-bg-glass)", backdropFilter: "blur(16px)", zIndex: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button 
              onClick={onClose} 
              style={{ color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer", display: "flex" }}
            >
              <X size={22} />
            </button>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>
                Edit Profile
              </h2>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                Customize your public presence
              </span>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={loading || !name.trim()}
            style={{
              padding: "10px 24px", borderRadius: "99px",
              background: "var(--color-primary, #1d9bf0)", color: "#ffffff", fontWeight: 800,
              display: "flex", alignItems: "center", gap: "8px", opacity: (loading || !name.trim()) ? 0.6 : 1,
              border: "none", cursor: "pointer", fontSize: "0.95rem", boxShadow: "0 4px 16px rgba(29, 155, 240, 0.4)"
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          
          {/* Cover Photo Adjuster Canvas */}
          <div style={{ position: "relative", height: "190px", background: "var(--color-primary-light)", overflow: "hidden" }}>
             {coverImage ? (
               <img 
                 src={coverImage} 
                 alt="Cover"
                 style={{ 
                   width: "100%", height: "100%", 
                   objectFit: "cover", 
                   transform: `scale(${coverZoom})`,
                   objectPosition: `50% ${coverPosY}%`,
                   transition: "transform 0.1s ease" 
                 }} 
               />
             ) : (
               <div style={{ width: "100%", height: "100%", background: "linear-gradient(45deg, var(--color-primary), #00c6ff)" }} />
             )}

             <div style={{ 
               position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
               background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" 
             }}>
                <button 
                  onClick={() => coverInputRef.current?.click()}
                  style={{ 
                    padding: "10px 18px", borderRadius: "99px", background: "rgba(0,0,0,0.65)", 
                    color: "white", display: "flex", alignItems: "center", gap: "8px", 
                    border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" 
                  }}
                >
                  <Camera size={18} />
                  <span>Change Cover</span>
                </button>

                {coverImage && (
                  <button 
                    onClick={() => setActiveAdjustTarget(activeAdjustTarget === "cover" ? null : "cover")}
                    style={{ 
                      padding: "10px 18px", borderRadius: "99px", 
                      background: activeAdjustTarget === "cover" ? "var(--color-primary)" : "rgba(0,0,0,0.65)", 
                      color: "white", display: "flex", alignItems: "center", gap: "8px", 
                      border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" 
                    }}
                  >
                    <Move size={18} />
                    <span>Adjust Position</span>
                  </button>
                )}
             </div>
             <input type="file" ref={coverInputRef} onChange={e => handleFileChange(e, "cover")} accept="image/*" style={{ display: "none" }} />
          </div>

          {/* Interactive Cover Adjustment Slider Bar */}
          {activeAdjustTarget === "cover" && (
            <div style={{
              background: "var(--color-bg-base)", padding: "12px 24px", borderBottom: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", gap: "20px"
            }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 700 }}>Zoom</span>
                <input 
                  type="range" min="1" max="2" step="0.05"
                  value={coverZoom}
                  onChange={e => setCoverZoom(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--color-primary)" }}
                />
              </div>

              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 700 }}>Vertical Position</span>
                <input 
                  type="range" min="0" max="100" step="1"
                  value={coverPosY}
                  onChange={e => setCoverPosY(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--color-primary)" }}
                />
              </div>
            </div>
          )}

          {/* Avatar Photo Adjuster Canvas */}
          <div style={{ padding: "0 24px", position: "relative" }}>
             <div style={{ 
               width: "124px", height: "124px", borderRadius: "50%", border: "4px solid var(--color-bg-surface)",
               background: "var(--color-bg-base)", marginTop: "-62px", overflow: "hidden", position: "relative",
               boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
             }}>
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Avatar"
                    style={{ 
                      width: "100%", height: "100%", objectFit: "cover",
                      transform: `scale(${avatarZoom})`,
                      objectPosition: `50% ${avatarPosY}%`,
                      transition: "transform 0.1s ease"
                    }} 
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "2.5rem", fontWeight: 800 }}>
                    {name.charAt(0).toUpperCase() || "?"}
                  </div>
                )}

                <div style={{ 
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
                  background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" 
                }}>
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    style={{ 
                      width: "40px", height: "40px", borderRadius: "50%", 
                      background: "rgba(0,0,0,0.7)", color: "white", 
                      display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" 
                    }}
                    title="Upload Avatar"
                  >
                    <Camera size={20} />
                  </button>

                  {avatar && (
                    <button 
                      onClick={() => setActiveAdjustTarget(activeAdjustTarget === "avatar" ? null : "avatar")}
                      style={{ 
                        width: "40px", height: "40px", borderRadius: "50%", 
                        background: activeAdjustTarget === "avatar" ? "var(--color-primary)" : "rgba(0,0,0,0.7)", 
                        color: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" 
                      }}
                      title="Adjust Avatar Position"
                    >
                      <Move size={18} />
                    </button>
                  )}
                </div>
                <input type="file" ref={avatarInputRef} onChange={e => handleFileChange(e, "avatar")} accept="image/*" style={{ display: "none" }} />
             </div>
          </div>

          {/* Interactive Avatar Adjustment Slider Bar */}
          {activeAdjustTarget === "avatar" && (
            <div style={{
              background: "var(--color-bg-base)", padding: "12px 24px", marginTop: "12px", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", gap: "20px"
            }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 700 }}>Avatar Zoom</span>
                <input 
                  type="range" min="1" max="2.5" step="0.05"
                  value={avatarZoom}
                  onChange={e => setAvatarZoom(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--color-primary)" }}
                />
              </div>

              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 700 }}>Position</span>
                <input 
                  type="range" min="0" max="100" step="1"
                  value={avatarPosY}
                  onChange={e => setAvatarPosY(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--color-primary)" }}
                />
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "22px" }}>
            {errorMsg && (
              <div style={{ padding: "12px 16px", borderRadius: "14px", background: "rgba(255, 77, 77, 0.15)", color: "#ff4d4d", fontSize: "0.9rem", fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}

            {/* Name Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Display Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your Name"
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--color-border)",
                  background: "var(--color-bg-base)", color: "var(--color-text-main)", outline: "none", fontSize: "1rem", fontWeight: 600
                }}
              />
            </div>

            {/* Username Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Username (@unique)</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "16px", color: "var(--color-primary)", fontWeight: 800 }}>@</span>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="username"
                  style={{
                    width: "100%", padding: "14px 16px 14px 36px", borderRadius: "14px", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-base)", color: "var(--color-text-main)", outline: "none", fontSize: "1rem", fontWeight: 600
                  }}
                />
              </div>
            </div>

            {/* Bio Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Bio</label>
              <textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell the world about yourself..."
                rows={3}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--color-border)",
                  background: "var(--color-bg-base)", color: "var(--color-text-main)", outline: "none", resize: "none", fontSize: "0.95rem"
                }}
              />
            </div>

            {/* Account Type Selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Account Category</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {[
                  { value: "CREATOR", label: "✨ Creator" },
                  { value: "BUSINESS", label: "🏢 Business" },
                  { value: "PERSON", label: "👤 Personal" }
                ].map((typeItem) => (
                  <button
                    key={typeItem.value}
                    type="button"
                    onClick={() => setAccountType(typeItem.value)}
                    style={{
                      padding: "12px", borderRadius: "14px",
                      border: accountType === typeItem.value ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background: accountType === typeItem.value ? "rgba(29, 155, 240, 0.1)" : "var(--color-bg-base)",
                      color: accountType === typeItem.value ? "var(--color-primary)" : "var(--color-text-main)",
                      fontWeight: 700, fontSize: "0.9rem", cursor: "pointer"
                    }}
                  >
                    {typeItem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Category Dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Professional Sub-Category</label>
              <select
                value={accountSubType}
                onChange={e => setAccountSubType(e.target.value)}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--color-border)",
                  background: "var(--color-bg-base)", color: "var(--color-text-main)", outline: "none", fontSize: "0.95rem", fontWeight: 600
                }}
              >
                {CATEGORY_OPTIONS.map((group, gIdx) => (
                  <optgroup key={gIdx} label={group.group}>
                    {group.items.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Gender & DOB */}
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-base)", color: "var(--color-text-main)", outline: "none", fontSize: "0.95rem"
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Date of Birth</label>
                <input 
                  type="date" 
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: "14px", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-base)", color: "var(--color-text-main)", outline: "none", fontSize: "0.95rem"
                  }}
                />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
