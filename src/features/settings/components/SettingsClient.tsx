"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./Settings.module.css";
import {
  User,
  ShieldCheck,
  Bell,
  Palette,
  Lock,
  HardDrive,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  VolumeX,
  Ban,
  Users,
  Sparkles,
  Loader2,
  Trash2,
  Globe,
  Moon,
  Sun,
  Monitor,
  Zap,
  Download,
  Info,
  ChevronRight
} from "lucide-react";

interface SettingsClientProps {
  initialProfile: any;
  initialMutedUsers: any[];
  initialBlockedUsers: any[];
  initialCloseFriends: any[];
}

export function SettingsClient({
  initialProfile,
  initialMutedUsers = [],
  initialBlockedUsers = [],
  initialCloseFriends = []
}: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "account" | "privacy" | "notifications" | "appearance" | "security" | "content" | "help"
  >("account");

  // Profile Form State
  const [name, setName] = useState(initialProfile?.name || "");
  const [username, setUsername] = useState(initialProfile?.username || "");
  const [email, setEmail] = useState(initialProfile?.email || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [accountType, setAccountType] = useState(initialProfile?.accountType || "PERSON");
  const [accountSubType, setAccountSubType] = useState(initialProfile?.accountSubType || "software_developer");
  const [showCategoryBadge, setShowCategoryBadge] = useState(true);
  const [targetCategoryPosts, setTargetCategoryPosts] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Dynamic Lists State
  const [mutedUsers, setMutedUsers] = useState(initialMutedUsers);
  const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers);
  const [closeFriends, setCloseFriends] = useState(initialCloseFriends);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Privacy & Safety Toggles
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [dmPermission, setDmPermission] = useState("everyone");
  const [tagPermission, setTagPermission] = useState("everyone");

  // Notification Toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [likesNotif, setLikesNotif] = useState(true);
  const [commentsNotif, setCommentsNotif] = useState(true);
  const [mentionsNotif, setMentionsNotif] = useState(true);
  const [dmsNotif, setDmsNotif] = useState(true);

  // Appearance State
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "system">("dark");
  const [accentColor, setAccentColor] = useState("#1d9bf0");
  const [fontSize, setFontSize] = useState("medium");
  const [reducedMotion, setReducedMotion] = useState(false);

  // Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  // Content & Storage State
  const [autoplayVideos, setAutoplayVideos] = useState(true);
  const [hdMediaUpload, setHdMediaUpload] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auto set default subType when accountType changes if current subType doesn't belong
  const handleCategoryChange = (newType: string) => {
    setAccountType(newType);
    if (newType === "PERSON") setAccountSubType("software_developer");
    else if (newType === "CREATOR") setAccountSubType("digital_creator");
    else if (newType === "BUSINESS") setAccountSubType("it_software_company");
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          bio,
          accountType,
          accountSubType
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      showToast("Profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      showToast("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(err.message || "Failed to change password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Unmute
  const handleUnmute = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/mute`, { method: "POST" });
      if (res.ok) {
        setMutedUsers((prev) => prev.filter((m) => m.mutedUser?.id !== userId));
        showToast("User unmuted");
      }
    } catch (e) {
      showToast("Failed to unmute user", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Unblock
  const handleUnblock = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/block`, { method: "POST" });
      if (res.ok) {
        setBlockedUsers((prev) => prev.filter((b) => b.blockedUser?.id !== userId));
        showToast("User unblocked");
      }
    } catch (e) {
      showToast("Failed to unblock user", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cache Clear handler
  const handleClearCache = () => {
    showToast("Cache and temporary data cleared (18.4 MB freed)");
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Sparkles size={28} style={{ color: "var(--color-primary, #1d9bf0)" }} />
          Settings & Preferences
        </h1>
        <p className={styles.subtitle}>
          Manage your account settings, privacy preferences, security options, and app experience.
        </p>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className={toastMessage.type === "success" ? styles.toastSuccess : styles.toastError}>
          {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Settings Navigation & Content */}
      <div className={styles.layoutGrid}>
        {/* Left Navigation Sidebar */}
        <nav className={styles.navSidebar}>
          <button
            className={`${styles.navButton} ${activeTab === "account" ? styles.navButtonActive : ""}`}
            onClick={() => setActiveTab("account")}
          >
            <div className={styles.navButtonLeft}>
              <User size={18} />
              <span>Account & Profile</span>
            </div>
            <ChevronRight size={16} className={styles.chevronIcon} />
          </button>

          <button
            className={`${styles.navButton} ${activeTab === "privacy" ? styles.navButtonActive : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            <div className={styles.navButtonLeft}>
              <ShieldCheck size={18} />
              <span>Privacy & Safety</span>
            </div>
            <ChevronRight size={16} className={styles.chevronIcon} />
          </button>

          <button
            className={`${styles.navButton} ${activeTab === "notifications" ? styles.navButtonActive : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <div className={styles.navButtonLeft}>
              <Bell size={18} />
              <span>Notifications</span>
            </div>
            <ChevronRight size={16} className={styles.chevronIcon} />
          </button>

          <button
            className={`${styles.navButton} ${activeTab === "appearance" ? styles.navButtonActive : ""}`}
            onClick={() => setActiveTab("appearance")}
          >
            <div className={styles.navButtonLeft}>
              <Palette size={18} />
              <span>Appearance & Theme</span>
            </div>
            <ChevronRight size={16} className={styles.chevronIcon} />
          </button>

          <button
            className={`${styles.navButton} ${activeTab === "security" ? styles.navButtonActive : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <div className={styles.navButtonLeft}>
              <Lock size={18} />
              <span>Security & Logins</span>
            </div>
            <ChevronRight size={16} className={styles.chevronIcon} />
          </button>

          <button
            className={`${styles.navButton} ${activeTab === "content" ? styles.navButtonActive : ""}`}
            onClick={() => setActiveTab("content")}
          >
            <div className={styles.navButtonLeft}>
              <HardDrive size={18} />
              <span>Content & Storage</span>
            </div>
            <ChevronRight size={16} className={styles.chevronIcon} />
          </button>

          <button
            className={`${styles.navButton} ${activeTab === "help" ? styles.navButtonActive : ""}`}
            onClick={() => setActiveTab("help")}
          >
            <div className={styles.navButtonLeft}>
              <HelpCircle size={18} />
              <span>Help & Support</span>
            </div>
            <ChevronRight size={16} className={styles.chevronIcon} />
          </button>
        </nav>

        {/* Right Content Panel */}
        <main className={styles.contentCard}>
          {/* TAB 1: ACCOUNT & PROFILE */}
          {activeTab === "account" && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <User size={22} /> Account Information
                  </h2>
                  <p className={styles.sectionDesc}>Update your basic profile info and account type.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className={styles.rowTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Full Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Username</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={email}
                    disabled
                    style={{ opacity: 0.7, cursor: "not-allowed" }}
                  />
                  <span className={styles.sublabel}>Email cannot be changed directly for security.</span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Bio</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the world a little about yourself..."
                  />
                </div>

                {/* Account Type Selector */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Account Category</label>
                  <div className={styles.accountTypeGrid}>
                    <div
                      className={`${styles.accountTypeCard} ${accountType === "PERSON" ? styles.accountTypeCardActive : ""}`}
                      onClick={() => handleCategoryChange("PERSON")}
                    >
                      <User size={20} style={{ color: "var(--color-primary, #1d9bf0)" }} />
                      <span className={styles.settingRowTitle}>Personal</span>
                      <span className={styles.settingRowDesc}>Standard social profile for personal networking.</span>
                    </div>

                    <div
                      className={`${styles.accountTypeCard} ${accountType === "CREATOR" ? styles.accountTypeCardActive : ""}`}
                      onClick={() => handleCategoryChange("CREATOR")}
                    >
                      <Sparkles size={20} style={{ color: "#8b5cf6" }} />
                      <span className={styles.settingRowTitle}>Creator</span>
                      <span className={styles.settingRowDesc}>For artists, public figures, and content creators.</span>
                    </div>

                    <div
                      className={`${styles.accountTypeCard} ${accountType === "BUSINESS" ? styles.accountTypeCardActive : ""}`}
                      onClick={() => handleCategoryChange("BUSINESS")}
                    >
                      <Globe size={20} style={{ color: "#10b981" }} />
                      <span className={styles.settingRowTitle}>Business</span>
                      <span className={styles.settingRowDesc}>For brands, businesses, and organizations.</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Sub-Category Selector */}
                <div className={styles.formGroup} style={{ marginTop: "12px" }}>
                  <label className={styles.label}>
                    {accountType === "CREATOR"
                      ? "Creator Sub-Category"
                      : accountType === "BUSINESS"
                      ? "Business Industry / Sub-Category"
                      : "Personal Profession / Sub-Category"}
                  </label>

                  {/* Theme-Matched Interactive Sub-Category Pill Cards */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "4px 0 8px 0" }}>
                    {accountType === "PERSON" && [
                      { id: "software_developer", label: "Software Developer", icon: "💻" },
                      { id: "student", label: "Student / Learner", icon: "🎓" },
                      { id: "tech_enthusiast", label: "Tech Enthusiast", icon: "⚡" },
                      { id: "gamer", label: "Gamer / Gaming Fan", icon: "🎮" },
                      { id: "fitness_enthusiast", label: "Fitness & Health", icon: "🏋️" },
                      { id: "photographer", label: "Photographer", icon: "📷" },
                      { id: "casual", label: "Personal Account", icon: "👤" }
                    ].map(item => (
                      <div
                        key={item.id}
                        onClick={() => setAccountSubType(item.id)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "99px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          background: accountSubType === item.id ? "rgba(29, 155, 240, 0.18)" : "#15202b",
                          border: accountSubType === item.id ? "1px solid var(--color-primary, #1d9bf0)" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: accountSubType === item.id ? "var(--color-primary, #1d9bf0)" : "#ffffff",
                          boxShadow: accountSubType === item.id ? "0 0 12px rgba(29, 155, 240, 0.25)" : "none"
                        }}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                        {accountSubType === item.id && <CheckCircle2 size={14} style={{ marginLeft: "2px" }} />}
                      </div>
                    ))}

                    {accountType === "CREATOR" && [
                      { id: "digital_creator", label: "Digital Creator", icon: "✨" },
                      { id: "software_engineer", label: "Software Engineer", icon: "💻" },
                      { id: "video_creator", label: "Video Creator / YouTuber", icon: "🎥" },
                      { id: "designer", label: "UI/UX Designer", icon: "🎨" },
                      { id: "musician", label: "Musician & Band", icon: "🎵" },
                      { id: "gaming_creator", label: "Gaming Streamer", icon: "🎮" },
                      { id: "educator", label: "Tech Educator", icon: "📚" },
                      { id: "writer", label: "Blogger & Writer", icon: "✍️" },
                      { id: "filmmaker", label: "Filmmaker", icon: "🎬" },
                      { id: "health_coach", label: "Fitness Coach", icon: "💪" },
                      { id: "podcaster", label: "Podcaster", icon: "🎙️" }
                    ].map(item => (
                      <div
                        key={item.id}
                        onClick={() => setAccountSubType(item.id)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "99px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          background: accountSubType === item.id ? "rgba(139, 92, 246, 0.18)" : "#15202b",
                          border: accountSubType === item.id ? "1px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: accountSubType === item.id ? "#a78bfa" : "#ffffff",
                          boxShadow: accountSubType === item.id ? "0 0 12px rgba(139, 92, 246, 0.25)" : "none"
                        }}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                        {accountSubType === item.id && <CheckCircle2 size={14} style={{ marginLeft: "2px" }} />}
                      </div>
                    ))}

                    {accountType === "BUSINESS" && [
                      { id: "it_software_company", label: "IT & Software Company", icon: "🏢" },
                      { id: "tech_startup", label: "Tech Startup", icon: "🚀" },
                      { id: "ecommerce_retail", label: "E-Commerce & Retail", icon: "🛍️" },
                      { id: "agency_consulting", label: "Agency & Consulting", icon: "💼" },
                      { id: "food_dining", label: "Restaurant & Dining", icon: "🍔" },
                      { id: "education_edtech", label: "EdTech & Academy", icon: "🎓" },
                      { id: "media_entertainment", label: "Media & Entertainment", icon: "📺" },
                      { id: "health_wellness", label: "Health & Wellness", icon: "🏥" },
                      { id: "non_profit", label: "Non-Profit Org", icon: "🤝" }
                    ].map(item => (
                      <div
                        key={item.id}
                        onClick={() => setAccountSubType(item.id)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "99px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          background: accountSubType === item.id ? "rgba(16, 185, 129, 0.18)" : "#15202b",
                          border: accountSubType === item.id ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: accountSubType === item.id ? "#34d399" : "#ffffff",
                          boxShadow: accountSubType === item.id ? "0 0 12px rgba(16, 185, 129, 0.25)" : "none"
                        }}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                        {accountSubType === item.id && <CheckCircle2 size={14} style={{ marginLeft: "2px" }} />}
                      </div>
                    ))}
                  </div>

                  <span className={styles.sublabel}>
                    Click to select your sub-category. This badge will be displayed on your profile header and helps algorithm target relevant feed posts.
                  </span>
                </div>

                {/* Sub-Category Preferences Toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                  <div className={styles.settingRow}>
                    <div className={styles.settingRowInfo}>
                      <span className={styles.settingRowTitle}>Display Category Badge on Profile</span>
                      <span className={styles.settingRowDesc}>Show your selected sub-category badge on your public profile header.</span>
                    </div>
                    <button
                      type="button"
                      className={`${styles.toggleSwitch} ${showCategoryBadge ? styles.toggleSwitchActive : ""}`}
                      onClick={() => setShowCategoryBadge(!showCategoryBadge)}
                    >
                      <div className={styles.toggleDot} />
                    </button>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingRowInfo}>
                      <span className={styles.settingRowTitle}>Category-based Feed Targeting</span>
                      <span className={styles.settingRowDesc}>Push recommended posts & communities matching your category interests.</span>
                    </div>
                    <button
                      type="button"
                      className={`${styles.toggleSwitch} ${targetCategoryPosts ? styles.toggleSwitchActive : ""}`}
                      onClick={() => setTargetCategoryPosts(!targetCategoryPosts)}
                    >
                      <div className={styles.toggleDot} />
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className={styles.btnPrimary} disabled={isSavingProfile}>
                    {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>

              {/* Password Section */}
              <div className={styles.sectionHeader} style={{ marginTop: "24px" }}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Lock size={20} /> Change Password
                  </h2>
                  <p className={styles.sectionDesc}>Ensure your account is using a strong password.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Current Password</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className={styles.rowTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>New Password</label>
                    <input
                      type="password"
                      className={styles.input}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Confirm New Password</label>
                    <input
                      type="password"
                      className={styles.input}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className={styles.btnPrimary} disabled={isChangingPassword}>
                    {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* TAB 2: PRIVACY & SAFETY */}
          {activeTab === "privacy" && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <ShieldCheck size={22} /> Privacy & Safety
                  </h2>
                  <p className={styles.sectionDesc}>Control who can see your content and interact with you.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Private Account</span>
                    <span className={styles.settingRowDesc}>
                      Only approved followers can see your posts and media updates.
                    </span>
                  </div>
                  <button
                    className={`${styles.toggleSwitch} ${isPrivateAccount ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      setIsPrivateAccount(!isPrivateAccount);
                      showToast(isPrivateAccount ? "Account set to Public" : "Account set to Private");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Direct Messaging</span>
                    <span className={styles.settingRowDesc}>Choose who can send you direct message requests.</span>
                  </div>
                  <select
                    className={styles.input}
                    style={{ width: "180px" }}
                    value={dmPermission}
                    onChange={(e) => {
                      setDmPermission(e.target.value);
                      showToast("Direct message preferences updated");
                    }}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="followers">Followers only</option>
                    <option value="none">No one</option>
                  </select>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Mentions & Tagging</span>
                    <span className={styles.settingRowDesc}>Control who can tag you in posts and comments.</span>
                  </div>
                  <select
                    className={styles.input}
                    style={{ width: "180px" }}
                    value={tagPermission}
                    onChange={(e) => {
                      setTagPermission(e.target.value);
                      showToast("Tagging preferences saved");
                    }}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="following">People You Follow</option>
                    <option value="none">No one</option>
                  </select>
                </div>
              </div>

              {/* Muted Users Section */}
              <div className={styles.sectionHeader} style={{ marginTop: "24px" }}>
                <div>
                  <h3 className={styles.sectionTitle} style={{ fontSize: "1.1rem" }}>
                    <VolumeX size={18} /> Muted Accounts ({mutedUsers.length})
                  </h3>
                  <p className={styles.sectionDesc}>Posts from muted accounts will not appear in your feed.</p>
                </div>
              </div>

              {mutedUsers.length === 0 ? (
                <p className="text-muted" style={{ textAlign: "center", padding: "20px" }}>
                  No muted accounts.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {mutedUsers.map((m) => (
                    <div key={m.mutedUser?.id} className={styles.userItem}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className={styles.userAvatar}>{m.mutedUser?.name?.charAt(0) || "U"}</div>
                        <div>
                          <div className={styles.settingRowTitle}>{m.mutedUser?.name || "User"}</div>
                          <div className={styles.settingRowDesc}>@{m.mutedUser?.username || "username"}</div>
                        </div>
                      </div>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleUnmute(m.mutedUser?.id)}
                        disabled={actionLoadingId === m.mutedUser?.id}
                      >
                        {actionLoadingId === m.mutedUser?.id ? <Loader2 size={14} className="animate-spin" /> : "Unmute"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Blocked Users Section */}
              <div className={styles.sectionHeader} style={{ marginTop: "24px" }}>
                <div>
                  <h3 className={styles.sectionTitle} style={{ fontSize: "1.1rem" }}>
                    <Ban size={18} /> Blocked Accounts ({blockedUsers.length})
                  </h3>
                  <p className={styles.sectionDesc}>Blocked accounts cannot see your profile or send you messages.</p>
                </div>
              </div>

              {blockedUsers.length === 0 ? (
                <p className="text-muted" style={{ textAlign: "center", padding: "20px" }}>
                  No blocked accounts.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {blockedUsers.map((b) => (
                    <div key={b.blockedUser?.id} className={styles.userItem}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className={styles.userAvatar} style={{ background: "#ff4d4d" }}>
                          {b.blockedUser?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className={styles.settingRowTitle}>{b.blockedUser?.name || "User"}</div>
                          <div className={styles.settingRowDesc}>@{b.blockedUser?.username || "username"}</div>
                        </div>
                      </div>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleUnblock(b.blockedUser?.id)}
                        disabled={actionLoadingId === b.blockedUser?.id}
                      >
                        {actionLoadingId === b.blockedUser?.id ? <Loader2 size={14} className="animate-spin" /> : "Unblock"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Bell size={22} /> Notification Preferences
                  </h2>
                  <p className={styles.sectionDesc}>Customize how and when you receive activity alerts.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Push Notifications</span>
                    <span className={styles.settingRowDesc}>Receive push alerts on desktop and mobile devices.</span>
                  </div>
                  <button
                    className={`${styles.toggleSwitch} ${pushEnabled ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      setPushEnabled(!pushEnabled);
                      showToast(pushEnabled ? "Push notifications disabled" : "Push notifications enabled");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Email Digests</span>
                    <span className={styles.settingRowDesc}>Receive periodic email summaries of weekly activity.</span>
                  </div>
                  <button
                    className={`${styles.toggleSwitch} ${emailDigest ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      setEmailDigest(!emailDigest);
                      showToast(emailDigest ? "Email digest disabled" : "Email digest enabled");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>
              </div>

              <div className={styles.sectionHeader} style={{ marginTop: "24px" }}>
                <h3 className={styles.sectionTitle} style={{ fontSize: "1.1rem" }}>
                  Activity Alerts
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className={styles.settingRow}>
                  <span className={styles.settingRowTitle}>Likes & Reactions</span>
                  <button
                    className={`${styles.toggleSwitch} ${likesNotif ? styles.toggleSwitchActive : ""}`}
                    onClick={() => setLikesNotif(!likesNotif)}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <span className={styles.settingRowTitle}>Comments & Replies</span>
                  <button
                    className={`${styles.toggleSwitch} ${commentsNotif ? styles.toggleSwitchActive : ""}`}
                    onClick={() => setCommentsNotif(!commentsNotif)}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <span className={styles.settingRowTitle}>Mentions & Retweets</span>
                  <button
                    className={`${styles.toggleSwitch} ${mentionsNotif ? styles.toggleSwitchActive : ""}`}
                    onClick={() => setMentionsNotif(!mentionsNotif)}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <span className={styles.settingRowTitle}>Direct Messages</span>
                  <button
                    className={`${styles.toggleSwitch} ${dmsNotif ? styles.toggleSwitchActive : ""}`}
                    onClick={() => setDmsNotif(!dmsNotif)}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 4: APPEARANCE & THEME */}
          {activeTab === "appearance" && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Palette size={22} /> Appearance & Theme
                  </h2>
                  <p className={styles.sectionDesc}>Customize visual aesthetics, colors, and layout density.</p>
                </div>
              </div>

              {/* Theme Mode */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Theme Mode</label>
                <div className={styles.rowTwo} style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <div
                    className={`${styles.accountTypeCard} ${themeMode === "dark" ? styles.accountTypeCardActive : ""}`}
                    onClick={() => {
                      setThemeMode("dark");
                      showToast("Dark mode activated");
                    }}
                  >
                    <Moon size={20} style={{ color: "#1d9bf0" }} />
                    <span className={styles.settingRowTitle}>Dark Mode</span>
                    <span className={styles.settingRowDesc}>Default dark aesthetic.</span>
                  </div>

                  <div
                    className={`${styles.accountTypeCard} ${themeMode === "light" ? styles.accountTypeCardActive : ""}`}
                    onClick={() => {
                      setThemeMode("light");
                      showToast("Light mode preview enabled");
                    }}
                  >
                    <Sun size={20} style={{ color: "#f59e0b" }} />
                    <span className={styles.settingRowTitle}>Light Mode</span>
                    <span className={styles.settingRowDesc}>Clean bright theme.</span>
                  </div>

                  <div
                    className={`${styles.accountTypeCard} ${themeMode === "system" ? styles.accountTypeCardActive : ""}`}
                    onClick={() => {
                      setThemeMode("system");
                      showToast("System preference theme set");
                    }}
                  >
                    <Monitor size={20} style={{ color: "#10b981" }} />
                    <span className={styles.settingRowTitle}>System</span>
                    <span className={styles.settingRowDesc}>Sync with your OS.</span>
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className={styles.formGroup} style={{ marginTop: "16px" }}>
                <label className={styles.label}>Accent Color</label>
                <div className={styles.colorPickerGroup}>
                  {["#1d9bf0", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"].map((color) => (
                    <div
                      key={color}
                      className={`${styles.colorCircle} ${accentColor === color ? styles.colorCircleActive : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setAccentColor(color);
                        showToast(`Accent color updated to ${color}`);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className={styles.settingRow} style={{ marginTop: "16px" }}>
                <div className={styles.settingRowInfo}>
                  <span className={styles.settingRowTitle}>Font Size</span>
                  <span className={styles.settingRowDesc}>Adjust reading text size across the application.</span>
                </div>
                <select
                  className={styles.input}
                  style={{ width: "160px" }}
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(e.target.value);
                    showToast(`Font size set to ${e.target.value}`);
                  }}
                >
                  <option value="small">Small (14px)</option>
                  <option value="medium">Medium (16px)</option>
                  <option value="large">Large (18px)</option>
                </select>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingRowInfo}>
                  <span className={styles.settingRowTitle}>Reduce Motion</span>
                  <span className={styles.settingRowDesc}>Disable decorative UI animations and transitions.</span>
                </div>
                <button
                  className={`${styles.toggleSwitch} ${reducedMotion ? styles.toggleSwitchActive : ""}`}
                  onClick={() => {
                    setReducedMotion(!reducedMotion);
                    showToast(reducedMotion ? "Animations enabled" : "Animations reduced");
                  }}
                >
                  <div className={styles.toggleDot} />
                </button>
              </div>
            </>
          )}

          {/* TAB 5: SECURITY & LOGINS */}
          {activeTab === "security" && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Lock size={22} /> Security & Logins
                  </h2>
                  <p className={styles.sectionDesc}>Manage login security, two-factor authentication, and devices.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Two-Factor Authentication (2FA)</span>
                    <span className={styles.settingRowDesc}>
                      Protect your account with an extra verification step during sign-in.
                    </span>
                  </div>
                  <button
                    className={`${styles.toggleSwitch} ${twoFactorEnabled ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      showToast(twoFactorEnabled ? "2FA disabled" : "2FA activated for your account");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Unrecognized Login Alerts</span>
                    <span className={styles.settingRowDesc}>
                      Get instant alerts if someone logs in from a new device or browser.
                    </span>
                  </div>
                  <button
                    className={`${styles.toggleSwitch} ${loginAlerts ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      setLoginAlerts(!loginAlerts);
                      showToast(loginAlerts ? "Login alerts disabled" : "Login alerts enabled");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className={styles.sectionHeader} style={{ marginTop: "24px" }}>
                <h3 className={styles.sectionTitle} style={{ fontSize: "1.1rem" }}>
                  <Smartphone size={18} /> Active Sessions
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className={styles.deviceItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <Monitor size={22} style={{ color: "var(--color-primary, #1d9bf0)" }} />
                    <div>
                      <div className={styles.settingRowTitle}>Windows PC — Chrome Browser</div>
                      <div className={styles.settingRowDesc}>Active now • New Delhi, India</div>
                    </div>
                  </div>
                  <span className={styles.badgePreview} style={{ background: "#10b981" }}>
                    Current Session
                  </span>
                </div>

                <div className={styles.deviceItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <Smartphone size={22} style={{ color: "var(--color-text-muted, #8b98a5)" }} />
                    <div>
                      <div className={styles.settingRowTitle}>iPhone 15 Pro — DOST Mobile App</div>
                      <div className={styles.settingRowDesc}>Last active 2 hours ago</div>
                    </div>
                  </div>
                  <button
                    className={styles.btnDanger}
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    onClick={() => showToast("Session logged out")}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 6: CONTENT & STORAGE */}
          {activeTab === "content" && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <HardDrive size={22} /> Content & Storage
                  </h2>
                  <p className={styles.sectionDesc}>Manage media quality, data saver modes, and app storage.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Autoplay Videos</span>
                    <span className={styles.settingRowDesc}>Autoplay feed videos as you scroll through posts.</span>
                  </div>
                  <button
                    className={`${styles.toggleSwitch} ${autoplayVideos ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      setAutoplayVideos(!autoplayVideos);
                      showToast(autoplayVideos ? "Autoplay disabled" : "Autoplay enabled");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>High Quality HD Uploads</span>
                    <span className={styles.settingRowDesc}>Upload photos and videos in highest resolution.</span>
                  </div>
                  <button
                    className={`${styles.toggleSwitch} ${hdMediaUpload ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      setHdMediaUpload(!hdMediaUpload);
                      showToast(hdMediaUpload ? "Standard upload mode set" : "HD Upload mode enabled");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Data Saver Mode</span>
                    <span className={styles.settingRowDesc}>Reduce bandwidth usage by compressing feed media.</span>
                  </div>
                  <button
                    className={`${styles.toggleSwitch} ${dataSaver ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      setDataSaver(!dataSaver);
                      showToast(dataSaver ? "Data saver disabled" : "Data saver activated");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>
              </div>

              <div className={styles.sectionHeader} style={{ marginTop: "24px" }}>
                <h3 className={styles.sectionTitle} style={{ fontSize: "1.1rem" }}>
                  Storage Management
                </h3>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingRowInfo}>
                  <span className={styles.settingRowTitle}>App Cache & Media Storage</span>
                  <span className={styles.settingRowDesc}>Free up temporary local storage used for preloaded feed items.</span>
                </div>
                <button className={styles.btnPrimary} onClick={handleClearCache}>
                  Clear Cache
                </button>
              </div>
            </>
          )}

          {/* TAB 7: HELP & SUPPORT */}
          {activeTab === "help" && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <HelpCircle size={22} /> Help & Support
                  </h2>
                  <p className={styles.sectionDesc}>Access help center, community rules, or report an issue.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className={styles.settingRow} style={{ cursor: "pointer" }} onClick={() => showToast("Opening Help Center...")}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Help Center & Knowledge Base</span>
                    <span className={styles.settingRowDesc}>Search tutorials, FAQs, and platform guides.</span>
                  </div>
                  <Info size={20} style={{ color: "var(--color-primary, #1d9bf0)" }} />
                </div>

                <div className={styles.settingRow} style={{ cursor: "pointer" }} onClick={() => showToast("Bug reporting modal coming soon!")}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Report a Problem / Bug</span>
                    <span className={styles.settingRowDesc}>Submit feedback or let us know about broken features.</span>
                  </div>
                  <AlertCircle size={20} style={{ color: "#f59e0b" }} />
                </div>

                <div className={styles.settingRow} style={{ cursor: "pointer" }} onClick={() => showToast("Displaying Terms of Service")}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Terms of Service & Community Guidelines</span>
                    <span className={styles.settingRowDesc}>Read our platform terms, user rules, and safety guidelines.</span>
                  </div>
                  <Globe size={20} style={{ color: "var(--color-text-muted, #8b98a5)" }} />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>About DOST Application</span>
                    <span className={styles.settingRowDesc}>Version 1.4.0 (Build 2026.08) — All Rights Reserved.</span>
                  </div>
                  <span className={styles.badgePreview}>Latest</span>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
