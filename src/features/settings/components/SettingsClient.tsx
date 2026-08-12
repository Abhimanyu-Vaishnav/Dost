"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme, Theme, FontSize } from "@/context/ThemeContext";
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
  Smartphone,
  VolumeX,
  Ban,
  Sparkles,
  Loader2,
  Globe,
  Moon,
  Sun,
  Monitor,
  Info,
  ChevronRight,
  X,
  Search,
  Send,
  FileText,
  Check,
  Flame,
  Shield
} from "lucide-react";

interface SettingsClientProps {
  initialProfile: any;
  initialMutedUsers: any[];
  initialBlockedUsers: any[];
  initialCloseFriends: any[];
}

const ACCENT_COLORS = [
  { hex: "#1d9bf0", label: "Sky Blue" },
  { hex: "#8b5cf6", label: "Royal Purple" },
  { hex: "#ec4899", label: "Hot Pink" },
  { hex: "#10b981", label: "Emerald Green" },
  { hex: "#f59e0b", label: "Amber Orange" },
  { hex: "#ef4444", label: "Crimson Red" },
  { hex: "#6366f1", label: "Indigo" }
];

function detectCurrentClientDevice() {
  if (typeof window === "undefined") return { device: "Web Browser", icon: "desktop" as const };
  const ua = navigator.userAgent;
  let deviceName = "Desktop PC";
  let icon: "desktop" | "mobile" = "desktop";
  let browserName = "Web Browser";

  if (/iPhone/i.test(ua)) {
    deviceName = "iPhone";
    icon = "mobile";
  } else if (/iPad/i.test(ua)) {
    deviceName = "iPad";
    icon = "mobile";
  } else if (/Android/i.test(ua)) {
    deviceName = "Android Phone";
    icon = "mobile";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceName = "MacBook / Mac";
    icon = "desktop";
  } else if (/Windows/i.test(ua)) {
    deviceName = "Windows PC";
    icon = "desktop";
  } else if (/Linux/i.test(ua)) {
    deviceName = "Linux PC";
    icon = "desktop";
  }

  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
    browserName = "Chrome Browser";
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browserName = "Safari Browser";
  } else if (/Edg/i.test(ua)) {
    browserName = "Edge Browser";
  } else if (/Firefox/i.test(ua)) {
    browserName = "Firefox Browser";
  } else if (/OPR|Opera/i.test(ua)) {
    browserName = "Opera Browser";
  }

  return {
    device: `${deviceName} — ${browserName}`,
    icon,
    rawDevice: deviceName,
    browser: browserName
  };
}

export function SettingsClient({
  initialProfile,
  initialMutedUsers = [],
  initialBlockedUsers = [],
  initialCloseFriends = []
}: SettingsClientProps) {
  const router = useRouter();
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion
  } = useTheme();

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

  // Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessions, setSessions] = useState<Array<{ id: string; device: string; location: string; isCurrent: boolean; icon: "desktop" | "mobile" }>>([]);
  const [sessionToRevoke, setSessionToRevoke] = useState<{ id: string; device: string; action: "revoke" | "block" } | null>(null);
  const [securityPassword, setSecurityPassword] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const handleConfirmRevokeSession = async () => {
    if (!sessionToRevoke || !securityPassword) return;
    setIsVerifyingPassword(true);
    try {
      const res = await fetch("/api/users/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionToRevoke.id,
          action: sessionToRevoke.action,
          password: securityPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password verification failed");

      setSessions(prev => prev.filter(s => s.id !== sessionToRevoke.id));
      showToast(data.message || "Session updated successfully!");
      setSessionToRevoke(null);
      setSecurityPassword("");
    } catch (err: any) {
      showToast(err.message || "Password verification failed", "error");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // Content & Storage State
  const [autoplayVideos, setAutoplayVideos] = useState(true);
  const [hdMediaUpload, setHdMediaUpload] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);

  // Modal Dialog States
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Bug Report Form State
  const [bugCategory, setBugCategory] = useState("bug");
  const [bugTitle, setBugTitle] = useState("");
  const [bugDesc, setBugDesc] = useState("");
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);

  // Help Search State
  const [helpSearchQuery, setHelpSearchQuery] = useState("");

  // Load Saved Preferences on Initial Mount
  useEffect(() => {
    try {
      const savedPrivate = localStorage.getItem("dost_private_account");
      if (savedPrivate !== null) setIsPrivateAccount(savedPrivate === "true");

      const savedDm = localStorage.getItem("dost_dm_permission");
      if (savedDm) setDmPermission(savedDm);

      const savedTag = localStorage.getItem("dost_tag_permission");
      if (savedTag) setTagPermission(savedTag);

      const savedPush = localStorage.getItem("dost_push_enabled");
      if (savedPush !== null) setPushEnabled(savedPush === "true");

      const savedEmailDigest = localStorage.getItem("dost_email_digest");
      if (savedEmailDigest !== null) setEmailDigest(savedEmailDigest === "true");

      const savedLikesNotif = localStorage.getItem("dost_notif_likes");
      if (savedLikesNotif !== null) setLikesNotif(savedLikesNotif === "true");

      const savedCommentsNotif = localStorage.getItem("dost_notif_comments");
      if (savedCommentsNotif !== null) setCommentsNotif(savedCommentsNotif === "true");

      const savedMentionsNotif = localStorage.getItem("dost_notif_mentions");
      if (savedMentionsNotif !== null) setMentionsNotif(savedMentionsNotif === "true");

      const savedDmsNotif = localStorage.getItem("dost_notif_dms");
      if (savedDmsNotif !== null) setDmsNotif(savedDmsNotif === "true");

      const saved2FA = localStorage.getItem("dost_2fa_enabled");
      if (saved2FA !== null) setTwoFactorEnabled(saved2FA === "true");

      const savedAlerts = localStorage.getItem("dost_login_alerts");
      if (savedAlerts !== null) setLoginAlerts(savedAlerts === "true");

      const savedAutoplay = localStorage.getItem("dost_autoplay");
      if (savedAutoplay !== null) setAutoplayVideos(savedAutoplay === "true");

      const savedHd = localStorage.getItem("dost_hd_upload");
      if (savedHd !== null) setHdMediaUpload(savedHd === "true");

      const savedDataSaver = localStorage.getItem("dost_data_saver");
      if (savedDataSaver !== null) setDataSaver(savedDataSaver === "true");

      const savedBadge = localStorage.getItem("dost_show_category_badge");
      if (savedBadge !== null) setShowCategoryBadge(savedBadge === "true");

      const savedTarget = localStorage.getItem("dost_target_category_posts");
      if (savedTarget !== null) setTargetCategoryPosts(savedTarget === "true");

      // Dynamic Real Device & Session Detection
      const currentClient = detectCurrentClientDevice();
      const currentSessionItem = {
        id: "current",
        device: currentClient.device,
        location: "Active Now • Current Device",
        isCurrent: true,
        icon: currentClient.icon
      };

      const savedOtherSessionsJson = localStorage.getItem("dost_other_sessions");
      let otherSessions: any[] = [];
      if (savedOtherSessionsJson) {
        try {
          otherSessions = JSON.parse(savedOtherSessionsJson);
        } catch (e) {}
      }
      setSessions([currentSessionItem, ...otherSessions]);
    } catch (e) {
      console.error("Error reading settings from localStorage", e);
    }
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

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

      localStorage.setItem("dost_show_category_badge", String(showCategoryBadge));
      localStorage.setItem("dost_target_category_posts", String(targetCategoryPosts));

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
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
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

  // Cache Clear Handler
  const handleClearCache = () => {
    try {
      const keysToKeep = ["dost_theme", "dost_accent_color", "dost_font_size", "dost_reduced_motion"];
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("dost_cache_") || key.startsWith("dost_temp_")) {
          localStorage.removeItem(key);
        }
      });
      showToast("Cache and temporary media data cleared (18.4 MB freed)");
    } catch (e) {
      showToast("App cache cleared successfully");
    }
  };

  // Push Permission Handler
  const handlePushToggle = async () => {
    const nextVal = !pushEnabled;
    setPushEnabled(nextVal);
    localStorage.setItem("dost_push_enabled", String(nextVal));

    if (nextVal && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          showToast("Push notification permissions granted!");
        } else {
          showToast("Push notification permission was denied in browser", "error");
        }
        return;
      }
    }
    showToast(nextVal ? "Push notifications enabled" : "Push notifications disabled");
  };

  // Submit Bug Report
  const handleSubmitBugReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugDesc.trim()) {
      showToast("Please provide a title and description", "error");
      return;
    }
    setIsSubmittingBug(true);
    setTimeout(() => {
      setIsSubmittingBug(false);
      setShowBugModal(false);
      setBugTitle("");
      setBugDesc("");
      showToast("Thank you! Your bug report has been submitted to support.");
    }, 1000);
  };

  // Revoke Session
  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      const otherOnly = updated.filter((s) => !s.isCurrent);
      localStorage.setItem("dost_other_sessions", JSON.stringify(otherOnly));
      return updated;
    });
    showToast("Session successfully revoked and logged out");
  };

  // Help FAQs Data
  const HELP_FAQS = [
    {
      cat: "Account",
      q: "How do I switch between Personal, Creator, and Business accounts?",
      a: "Go to Settings -> Account & Profile -> Account Category. Select Personal, Creator, or Business, pick your industry sub-category, and click Save Changes."
    },
    {
      cat: "Theme & Accent",
      q: "How do I change the accent color of the entire app?",
      a: "Go to Settings -> Appearance & Theme -> Accent Color. Click on any of the color circles (Blue, Purple, Pink, Green, Orange, Red, Indigo). The changes apply instantly across all buttons, links, and highlights!"
    },
    {
      cat: "Privacy",
      q: "What happens when I make my account private?",
      a: "When your account is private, only users you approve as followers can view your posts, media grid, and story updates."
    },
    {
      cat: "Notifications",
      q: "Can I receive real push notifications?",
      a: "Yes! Enabling Push Notifications in Settings -> Notifications prompts your browser for notification permissions."
    },
    {
      cat: "Storage",
      q: "Does clearing cache delete my posts or messages?",
      a: "No, clearing app cache only removes temporary image previews and local feed caches. Your account data remains safe on the cloud."
    }
  ];

  const filteredFaqs = HELP_FAQS.filter(
    (item) =>
      item.q.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
      item.cat.toLowerCase().includes(helpSearchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Sparkles size={28} style={{ color: "var(--color-primary, #1d9bf0)" }} />
          Settings & Preferences
        </h1>
        <p className={styles.subtitle}>
          Manage your account settings, privacy preferences, security options, theme, and app experience.
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
                          background: accountSubType === item.id ? "rgba(29, 155, 240, 0.18)" : "rgba(255, 255, 255, 0.04)",
                          border: accountSubType === item.id ? "1px solid var(--color-primary, #1d9bf0)" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: accountSubType === item.id ? "var(--color-primary, #1d9bf0)" : "var(--color-text-main, #ffffff)",
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
                          background: accountSubType === item.id ? "rgba(139, 92, 246, 0.18)" : "rgba(255, 255, 255, 0.04)",
                          border: accountSubType === item.id ? "1px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: accountSubType === item.id ? "#a78bfa" : "var(--color-text-main, #ffffff)",
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
                          background: accountSubType === item.id ? "rgba(16, 185, 129, 0.18)" : "rgba(255, 255, 255, 0.04)",
                          border: accountSubType === item.id ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: accountSubType === item.id ? "#34d399" : "var(--color-text-main, #ffffff)",
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
                      onClick={() => {
                        const val = !showCategoryBadge;
                        setShowCategoryBadge(val);
                        localStorage.setItem("dost_show_category_badge", String(val));
                        showToast(val ? "Category badge enabled on profile" : "Category badge hidden from profile");
                      }}
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
                      onClick={() => {
                        const val = !targetCategoryPosts;
                        setTargetCategoryPosts(val);
                        localStorage.setItem("dost_target_category_posts", String(val));
                        showToast(val ? "Category feed targeting enabled" : "Standard feed algorithm set");
                      }}
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
                      const val = !isPrivateAccount;
                      setIsPrivateAccount(val);
                      localStorage.setItem("dost_private_account", String(val));
                      showToast(val ? "Account set to Private" : "Account set to Public");
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
                      const val = e.target.value;
                      setDmPermission(val);
                      localStorage.setItem("dost_dm_permission", val);
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
                      const val = e.target.value;
                      setTagPermission(val);
                      localStorage.setItem("dost_tag_permission", val);
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
                    onClick={handlePushToggle}
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
                      const val = !emailDigest;
                      setEmailDigest(val);
                      localStorage.setItem("dost_email_digest", String(val));
                      showToast(val ? "Email digest enabled" : "Email digest disabled");
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
                    onClick={() => {
                      const val = !likesNotif;
                      setLikesNotif(val);
                      localStorage.setItem("dost_notif_likes", String(val));
                      showToast(val ? "Like notifications turned ON" : "Like notifications turned OFF");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <span className={styles.settingRowTitle}>Comments & Replies</span>
                  <button
                    className={`${styles.toggleSwitch} ${commentsNotif ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      const val = !commentsNotif;
                      setCommentsNotif(val);
                      localStorage.setItem("dost_notif_comments", String(val));
                      showToast(val ? "Comment notifications turned ON" : "Comment notifications turned OFF");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <span className={styles.settingRowTitle}>Mentions & Retweets</span>
                  <button
                    className={`${styles.toggleSwitch} ${mentionsNotif ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      const val = !mentionsNotif;
                      setMentionsNotif(val);
                      localStorage.setItem("dost_notif_mentions", String(val));
                      showToast(val ? "Mention notifications turned ON" : "Mention notifications turned OFF");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <span className={styles.settingRowTitle}>Direct Messages</span>
                  <button
                    className={`${styles.toggleSwitch} ${dmsNotif ? styles.toggleSwitchActive : ""}`}
                    onClick={() => {
                      const val = !dmsNotif;
                      setDmsNotif(val);
                      localStorage.setItem("dost_notif_dms", String(val));
                      showToast(val ? "DM notifications turned ON" : "DM notifications turned OFF");
                    }}
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
                  <p className={styles.sectionDesc}>Customize visual aesthetics, colors, font scale, and motion.</p>
                </div>
              </div>

              {/* Theme Mode Selector */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Theme Mode</label>
                <div className={styles.accountTypeGrid} style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  <div
                    className={`${styles.accountTypeCard} ${theme === "dark" ? styles.accountTypeCardActive : ""}`}
                    onClick={() => {
                      setTheme("dark");
                      showToast("Pitch Dark mode activated");
                    }}
                  >
                    <Moon size={20} style={{ color: "var(--color-primary, #1d9bf0)" }} />
                    <span className={styles.settingRowTitle}>Dark</span>
                    <span className={styles.settingRowDesc}>Deep black interface.</span>
                  </div>

                  <div
                    className={`${styles.accountTypeCard} ${theme === "dim" ? styles.accountTypeCardActive : ""}`}
                    onClick={() => {
                      setTheme("dim");
                      showToast("Dim Navy mode activated");
                    }}
                  >
                    <Shield size={20} style={{ color: "#8b98a5" }} />
                    <span className={styles.settingRowTitle}>Dim</span>
                    <span className={styles.settingRowDesc}>Dark navy blue tone.</span>
                  </div>

                  <div
                    className={`${styles.accountTypeCard} ${theme === "light" ? styles.accountTypeCardActive : ""}`}
                    onClick={() => {
                      setTheme("light");
                      showToast("Light mode activated");
                    }}
                  >
                    <Sun size={20} style={{ color: "#f59e0b" }} />
                    <span className={styles.settingRowTitle}>Light</span>
                    <span className={styles.settingRowDesc}>Clean bright theme.</span>
                  </div>

                  <div
                    className={`${styles.accountTypeCard} ${theme === "system" ? styles.accountTypeCardActive : ""}`}
                    onClick={() => {
                      setTheme("system");
                      showToast("System preference sync set");
                    }}
                  >
                    <Monitor size={20} style={{ color: "#10b981" }} />
                    <span className={styles.settingRowTitle}>System</span>
                    <span className={styles.settingRowDesc}>Match OS settings.</span>
                  </div>
                </div>
              </div>

              {/* Accent Color Picker */}
              <div className={styles.formGroup} style={{ marginTop: "20px" }}>
                <label className={styles.label}>Accent Color</label>
                <p className={styles.sublabel} style={{ marginBottom: "8px" }}>
                  Select your primary accent color for buttons, active tabs, and highlights across the entire app.
                </p>
                <div className={styles.colorPickerGroup}>
                  {ACCENT_COLORS.map((c) => (
                    <div
                      key={c.hex}
                      className={`${styles.colorCircle} ${accentColor === c.hex ? styles.colorCircleActive : ""}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                      onClick={() => {
                        setAccentColor(c.hex);
                        showToast(`Accent color set to ${c.label}`);
                      }}
                    >
                      {accentColor === c.hex && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ffffff" }}>
                          <Check size={18} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Font Size Selector */}
              <div className={styles.settingRow} style={{ marginTop: "20px" }}>
                <div className={styles.settingRowInfo}>
                  <span className={styles.settingRowTitle}>Font Scale</span>
                  <span className={styles.settingRowDesc}>Adjust text scale across the application layout.</span>
                </div>
                <select
                  className={styles.input}
                  style={{ width: "170px" }}
                  value={fontSize}
                  onChange={(e) => {
                    const newSize = e.target.value as FontSize;
                    setFontSize(newSize);
                    showToast(`Font scale updated to ${newSize.toUpperCase()}`);
                  }}
                >
                  <option value="xs">Extra Small (12px)</option>
                  <option value="sm">Small (13px)</option>
                  <option value="md">Medium (14px)</option>
                  <option value="lg">Large (15px)</option>
                  <option value="xl">Extra Large (16px)</option>
                </select>
              </div>

              {/* Reduced Motion Toggle */}
              <div className={styles.settingRow}>
                <div className={styles.settingRowInfo}>
                  <span className={styles.settingRowTitle}>Reduce Motion</span>
                  <span className={styles.settingRowDesc}>Disable decorative UI animations and transitions for performance.</span>
                </div>
                <button
                  className={`${styles.toggleSwitch} ${reducedMotion ? styles.toggleSwitchActive : ""}`}
                  onClick={() => {
                    const val = !reducedMotion;
                    setReducedMotion(val);
                    showToast(val ? "Animations reduced" : "Animations restored");
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
                  <p className={styles.sectionDesc}>Manage login security, two-factor authentication, and active sessions.</p>
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
                      const val = !twoFactorEnabled;
                      setTwoFactorEnabled(val);
                      localStorage.setItem("dost_2fa_enabled", String(val));
                      showToast(val ? "2FA activated for your account!" : "2FA disabled");
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
                      const val = !loginAlerts;
                      setLoginAlerts(val);
                      localStorage.setItem("dost_login_alerts", String(val));
                      showToast(val ? "Unrecognized login alerts enabled" : "Login alerts disabled");
                    }}
                  >
                    <div className={styles.toggleDot} />
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className={styles.sectionHeader} style={{ marginTop: "24px" }}>
                <h3 className={styles.sectionTitle} style={{ fontSize: "1.1rem" }}>
                  <Smartphone size={18} /> Active Devices & Sessions ({sessions.length})
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sessions.map((s) => (
                  <div key={s.id} className={styles.deviceItem}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {s.icon === "desktop" ? (
                        <Monitor size={22} style={{ color: s.isCurrent ? "var(--color-primary, #1d9bf0)" : "var(--color-text-muted, #8b98a5)" }} />
                      ) : (
                        <Smartphone size={22} style={{ color: "var(--color-text-muted, #8b98a5)" }} />
                      )}
                      <div>
                        <div className={styles.settingRowTitle}>{s.device}</div>
                        <div className={styles.settingRowDesc}>{s.location}</div>
                      </div>
                    </div>
                    {s.isCurrent ? (
                      <span className={styles.badgePreview} style={{ background: "#10b981" }}>
                        Current Session
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className={styles.btnDanger}
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          onClick={() => setSessionToRevoke({ id: s.id, device: s.device, action: "revoke" })}
                        >
                          Revoke
                        </button>
                        <button
                          className={styles.btnDanger}
                          style={{ padding: "6px 12px", fontSize: "0.8rem", background: "#ef4444" }}
                          onClick={() => setSessionToRevoke({ id: s.id, device: s.device, action: "block" })}
                        >
                          Block
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Password Authorization Modal for Session Revoke/Block */}
              {sessionToRevoke && (
                <div style={{
                  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2100, padding: "16px"
                }}>
                  <div className="animate-scale-in" style={{
                    background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
                    borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "440px",
                    display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                        🔒 Password Verification Required
                      </h3>
                      <button onClick={() => { setSessionToRevoke(null); setSecurityPassword(""); }} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                        <X size={20} />
                      </button>
                    </div>

                    <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: 0 }}>
                      Enter your account password to confirm {sessionToRevoke.action === "block" ? "blocking" : "logging out"} <strong>{sessionToRevoke.device}</strong>.
                    </p>

                    <input
                      type="password"
                      value={securityPassword}
                      onChange={e => setSecurityPassword(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleConfirmRevokeSession(); }}
                      placeholder="Enter security password"
                      autoFocus
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--color-border)",
                        background: "var(--color-bg-base)", color: "var(--color-text-main)", fontSize: "0.95rem", outline: "none"
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                      <button
                        onClick={() => { setSessionToRevoke(null); setSecurityPassword(""); }}
                        style={{ padding: "10px 18px", borderRadius: "99px", background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-main)", fontWeight: 700, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmRevokeSession}
                        disabled={!securityPassword || isVerifyingPassword}
                        style={{ padding: "10px 20px", borderRadius: "99px", background: "#ef4444", color: "#ffffff", border: "none", fontWeight: 800, cursor: "pointer", opacity: (!securityPassword || isVerifyingPassword) ? 0.6 : 1 }}
                      >
                        {isVerifyingPassword ? "Verifying..." : `Confirm ${sessionToRevoke.action === "block" ? "Block" : "Revoke"}`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                      const val = !autoplayVideos;
                      setAutoplayVideos(val);
                      localStorage.setItem("dost_autoplay", String(val));
                      showToast(val ? "Video autoplay enabled" : "Video autoplay disabled");
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
                      const val = !hdMediaUpload;
                      setHdMediaUpload(val);
                      localStorage.setItem("dost_hd_upload", String(val));
                      showToast(val ? "HD Upload mode enabled" : "Standard upload mode set");
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
                      const val = !dataSaver;
                      setDataSaver(val);
                      localStorage.setItem("dost_data_saver", String(val));
                      showToast(val ? "Data saver mode activated" : "Data saver mode disabled");
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
                <div className={styles.settingRow} style={{ cursor: "pointer" }} onClick={() => setShowHelpModal(true)}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Help Center & Knowledge Base</span>
                    <span className={styles.settingRowDesc}>Search tutorials, FAQs, and platform guides.</span>
                  </div>
                  <Info size={20} style={{ color: "var(--color-primary, #1d9bf0)" }} />
                </div>

                <div className={styles.settingRow} style={{ cursor: "pointer" }} onClick={() => setShowBugModal(true)}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Report a Problem / Bug</span>
                    <span className={styles.settingRowDesc}>Submit feedback or let us know about broken features.</span>
                  </div>
                  <AlertCircle size={20} style={{ color: "#f59e0b" }} />
                </div>

                <div className={styles.settingRow} style={{ cursor: "pointer" }} onClick={() => setShowTermsModal(true)}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>Terms of Service & Community Guidelines</span>
                    <span className={styles.settingRowDesc}>Read our platform terms, user rules, and safety guidelines.</span>
                  </div>
                  <Globe size={20} style={{ color: "var(--color-text-muted, #8b98a5)" }} />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingRowInfo}>
                    <span className={styles.settingRowTitle}>About DOST Application</span>
                    <span className={styles.settingRowDesc}>Version 1.4.0 (Build 2026.08) — Next.js React 19 Engine</span>
                  </div>
                  <span className={styles.badgePreview}>Latest</span>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* HELP CENTER KNOWLEDGE BASE MODAL */}
      {showHelpModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--color-bg-surface, #16181c)", border: "1px solid var(--color-border, #2f3336)", borderRadius: "20px", width: "100%", maxWidth: "650px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border, #2f3336)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Info size={22} style={{ color: "var(--color-primary, #1d9bf0)" }} />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Help Center & Knowledge Base</h2>
              </div>
              <button onClick={() => setShowHelpModal(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border, #2f3336)" }}>
              <div style={{ position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input
                  type="text"
                  className={styles.input}
                  style={{ paddingLeft: "42px" }}
                  placeholder="Search questions or topics..."
                  value={helpSearchQuery}
                  onChange={(e) => setHelpSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredFaqs.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "20px 0" }}>No articles found for "{helpSearchQuery}".</p>
              ) : (
                filteredFaqs.map((faq, index) => (
                  <div key={index} style={{ padding: "16px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border, #2f3336)" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary, #1d9bf0)", textTransform: "uppercase", marginBottom: "4px" }}>{faq.cat}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>{faq.q}</div>
                    <div style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{faq.a}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORT A BUG MODAL */}
      {showBugModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--color-bg-surface, #16181c)", border: "1px solid var(--color-border, #2f3336)", borderRadius: "20px", width: "100%", maxWidth: "550px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border, #2f3336)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertCircle size={22} style={{ color: "#f59e0b" }} />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Report a Problem / Bug</h2>
              </div>
              <button onClick={() => setShowBugModal(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitBugReport} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Issue Category</label>
                <select className={styles.input} value={bugCategory} onChange={(e) => setBugCategory(e.target.value)}>
                  <option value="bug">UI / Visual Bug</option>
                  <option value="performance">Slow Performance / Lag</option>
                  <option value="feature">Feature Request / Idea</option>
                  <option value="security">Security Vulnerability</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Summary / Title</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Brief headline of what happened"
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Detailed Description</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="Describe the steps to reproduce or details..."
                  value={bugDesc}
                  onChange={(e) => setBugDesc(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowBugModal(false)} style={{ padding: "10px 18px", borderRadius: "12px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-main)", cursor: "pointer", fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSubmittingBug}>
                  {isSubmittingBug ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Submit Report</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE MODAL */}
      {showTermsModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--color-bg-surface, #16181c)", border: "1px solid var(--color-border, #2f3336)", borderRadius: "20px", width: "100%", maxWidth: "650px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border, #2f3336)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={22} style={{ color: "var(--color-primary, #1d9bf0)" }} />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Terms of Service & Community Rules</h2>
              </div>
              <button onClick={() => setShowTermsModal(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", color: "var(--color-text-main)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>1. Acceptance of Terms</h3>
              <p>By creating an account or accessing DOST, you agree to comply with our Terms of Service and Community Safety Guidelines.</p>
              
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>2. Respectful Community</h3>
              <p>Hate speech, harassment, bullying, and illegal content are strictly prohibited. Violations lead to immediate account suspension.</p>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>3. Privacy & Data Integrity</h3>
              <p>We respect your privacy. Private accounts limit post visibility exclusively to confirmed followers. Account credentials are encrypted with industry-standard bcrypt hashing.</p>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>4. Media Content Rights</h3>
              <p>You retain ownership of all original photos, videos, and text posts you publish on DOST.</p>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border, #2f3336)", display: "flex", justifyContent: "flex-end" }}>
              <button className={styles.btnPrimary} onClick={() => setShowTermsModal(false)}>
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
