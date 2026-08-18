"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import styles from "./page.module.css";
import {
  Shield,
  Users,
  ArrowRight,
  Lock,
  Mail,
  User,
  Loader2,
  Sparkles,
  ShieldCheck,
  Heart,
  Repeat,
  MessageCircle,
  Share2,
  Flame,
  Sun,
  Moon,
  Check,
  Award,
  Hash
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  // Auth Form State
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Showcase Preview Active Tab
  const [previewTab, setPreviewTab] = useState<"feed" | "stories" | "communities" | "themes">("feed");

  // Sample Poll Option Selected State for interactive preview
  const [pollVotedOption, setPollVotedOption] = useState<number | null>(0);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = authMode === "login" ? { email, password } : { email, password, name: name || email.split("@")[0] };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error(`Server returned non-JSON response (${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      if (authMode === "login" && typeof window !== "undefined") {
        sessionStorage.setItem("dost_login_toast", JSON.stringify({ 
          message: `New login detected from ${data.loginDevice || "Device"}` 
        }));
      }

      window.location.href = "/feed";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setError("");
    const el = document.getElementById("auth-card");
    if (el) {
      try {
        const topPos = el.getBoundingClientRect().top + window.pageYOffset - 20;
        window.scrollTo({ top: topPos, behavior: "smooth" });
      } catch (e) {
        el.scrollIntoView();
      }
    }
  };

  return (
    <main className={styles.landingContainer}>
      {/* Background Visual Effects */}
      <div className={styles.bgGridPattern} />
      <div className={styles.meshGradient} />

      {/* Header / Navbar */}
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Sparkles size={22} />
          </div>
          <span className={styles.logoText}>DOST</span>
          <span className={styles.badgeVersion}>v2.0</span>
        </div>

        <div className={styles.headerRight}>
          <button onClick={() => scrollToAuth("login")} className={styles.headerLink}>
            Sign In
          </button>
          <button onClick={() => scrollToAuth("register")} className={styles.headerBtn}>
            Join DOST Free
          </button>
        </div>
      </header>

      {/* HERO SECTION: Split Pane */}
      <section className={styles.heroSplitSection}>
        {/* Left Column: Value Proposition & Dynamic Live Feature Switcher */}
        <div className={styles.brandingCol}>
          <div className={styles.brandingBadge}>
            <Flame size={14} className={styles.iconYellow} />
            <span>The Next Generation Social Network</span>
          </div>

          <h1 className={styles.brandingTitle}>
            Where Conversations <br />
            <span className={styles.gradientText}>Happen Naturally.</span>
          </h1>

          <p className={styles.brandingSubtitle}>
            Experience lightning-fast X-style feeds, 24-hour visual stories with polls, vibrant topic communities, 
            and custom accent theme engine — built for meaningful connections.
          </p>

          {/* Social Proof Badges */}
          <div className={styles.badgeRow}>
            <div className={styles.badgeCard}>
              <Users size={18} style={{ color: "var(--color-primary, #1d9bf0)" }} />
              <div>
                <span className={styles.badgeNum}>10k+</span>
                <span className={styles.badgeLabel}>Active Members</span>
              </div>
            </div>

            <div className={styles.badgeCard}>
              <Award size={18} style={{ color: "#8b5cf6" }} />
              <div>
                <span className={styles.badgeNum}>Creator Ready</span>
                <span className={styles.badgeLabel}>Professional Badges</span>
              </div>
            </div>

            <div className={styles.badgeCard}>
              <ShieldCheck size={18} style={{ color: "#10b981" }} />
              <div>
                <span className={styles.badgeNum}>100% Safe</span>
                <span className={styles.badgeLabel}>Privacy Controls</span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE LIVE PRODUCT DEMO PREVIEW */}
          <div className={styles.interactivePreview}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTabsRow}>
                <button
                  type="button"
                  className={`${styles.previewTabBtn} ${previewTab === "feed" ? styles.previewTabBtnActive : ""}`}
                  onClick={() => setPreviewTab("feed")}
                >
                  💬 Timeline Feed
                </button>
                <button
                  type="button"
                  className={`${styles.previewTabBtn} ${previewTab === "stories" ? styles.previewTabBtnActive : ""}`}
                  onClick={() => setPreviewTab("stories")}
                >
                  📸 24h Stories & Polls
                </button>
                <button
                  type="button"
                  className={`${styles.previewTabBtn} ${previewTab === "communities" ? styles.previewTabBtnActive : ""}`}
                  onClick={() => setPreviewTab("communities")}
                >
                  👥 Communities
                </button>
                <button
                  type="button"
                  className={`${styles.previewTabBtn} ${previewTab === "themes" ? styles.previewTabBtnActive : ""}`}
                  onClick={() => setPreviewTab("themes")}
                >
                  🎨 Live Theme Engine
                </button>
              </div>
            </div>

            <div className={styles.previewBody}>
              {/* PREVIEW 1: TIMELINE FEED */}
              {previewTab === "feed" && (
                <div className={styles.previewPostCard}>
                  <div className={styles.previewAvatar}>A</div>
                  <div className={styles.previewPostContent}>
                    <div className={styles.previewUserRow}>
                      <span className={styles.previewName}>Alex Rivera</span>
                      <span className={styles.previewBadge}>💻 Software Developer</span>
                      <span className={styles.previewHandle}>@alexr • 2m</span>
                    </div>
                    <p className={styles.previewText}>
                      Just pushed the brand new release on DOST! Rich code snippets, particle like bursts, and dark mode feel insanely crisp! 🚀✨
                    </p>

                    <div className={styles.codeSnippetBlock}>
                      <code>const status = "DOST 2.0 Released!";</code>
                    </div>

                    <div className={styles.previewActions}>
                      <span><MessageCircle size={15} /> 24</span>
                      <span><Repeat size={15} /> 12</span>
                      <span style={{ color: "#ec4899" }}><Heart size={15} fill="#ec4899" /> 148</span>
                      <span><Share2 size={15} /></span>
                    </div>
                  </div>
                </div>
              )}

              {/* PREVIEW 2: 24H STORIES & POLLS */}
              {previewTab === "stories" && (
                <div className={styles.storiesPreviewWrapper}>
                  <div className={styles.pollHeaderRow}>
                    <span className={styles.pollHeaderText}>Interactive Story Poll Preview</span>
                    <span className={styles.pollTimerText}>Expires in 18h</span>
                  </div>

                  <div className={styles.pollContainer}>
                    <p className={styles.pollQuestion}>
                      📊 Which stack do you prefer for high-scale apps in 2026?
                    </p>
                    <div className={styles.pollOptionsGroup}>
                      <div
                        className={`${styles.pollOptionCard} ${pollVotedOption === 0 ? styles.pollOptionCardActive : ""}`}
                        onClick={() => setPollVotedOption(0)}
                      >
                        <span>Next.js 16 + React 19 Engine</span>
                        <span className={styles.pollPctText}>72%</span>
                      </div>

                      <div
                        className={`${styles.pollOptionCard} ${pollVotedOption === 1 ? styles.pollOptionCardActive : ""}`}
                        onClick={() => setPollVotedOption(1)}
                      >
                        <span>Vite + Custom Micro-frontends</span>
                        <span className={styles.pollPctText}>28%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PREVIEW 3: COMMUNITIES */}
              {previewTab === "communities" && (
                <div className={styles.communityListGroup}>
                  <div className={styles.communityCard}>
                    <div className={styles.communityLeft}>
                      <div className={styles.communityIconBox} style={{ background: "rgba(29, 155, 240, 0.15)" }}>
                        💻
                      </div>
                      <div>
                        <div className={styles.communityTitle}>Full-Stack Devs Hub</div>
                        <div className={styles.communityMembers}>4.2k Members</div>
                      </div>
                    </div>
                    <button className={styles.communityJoinBtn} style={{ background: "#1d9bf0" }}>
                      Join Hub
                    </button>
                  </div>

                  <div className={styles.communityCard}>
                    <div className={styles.communityLeft}>
                      <div className={styles.communityIconBox} style={{ background: "rgba(236, 72, 153, 0.15)" }}>
                        🎨
                      </div>
                      <div>
                        <div className={styles.communityTitle}>UI/UX Designers Guild</div>
                        <div className={styles.communityMembers}>2.8k Members</div>
                      </div>
                    </div>
                    <button className={styles.communityJoinBtn} style={{ background: "#ec4899" }}>
                      Join Hub
                    </button>
                  </div>

                  <div className={styles.communityCard}>
                    <div className={styles.communityLeft}>
                      <div className={styles.communityIconBox} style={{ background: "rgba(16, 185, 129, 0.15)" }}>
                        🚀
                      </div>
                      <div>
                        <div className={styles.communityTitle}>Indie Hackers & Founders</div>
                        <div className={styles.communityMembers}>3.1k Members</div>
                      </div>
                    </div>
                    <button className={styles.communityJoinBtn} style={{ background: "#10b981" }}>
                      Join Hub
                    </button>
                  </div>
                </div>
              )}

              {/* PREVIEW 4: LIVE THEME PLAYGROUND */}
              {previewTab === "themes" && (
                <div className={styles.themePlaygroundGroup}>
                  <div className={styles.themePlaygroundTitle}>
                    ✨ Test Accent Colors & Themes Right Now:
                  </div>

                  {/* Accent Color Swatches */}
                  <div className={styles.swatchesRow}>
                    {[
                      { hex: "#1d9bf0", name: "Sky Blue" },
                      { hex: "#8b5cf6", name: "Royal Purple" },
                      { hex: "#ec4899", name: "Hot Pink" },
                      { hex: "#10b981", name: "Emerald Green" },
                      { hex: "#f59e0b", name: "Amber Orange" },
                      { hex: "#ef4444", name: "Crimson Red" }
                    ].map((c) => (
                      <div
                        key={c.hex}
                        onClick={() => setAccentColor(c.hex)}
                        className={`${styles.swatchCircle} ${accentColor === c.hex ? styles.swatchCircleActive : ""}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {accentColor === c.hex && <Check size={16} />}
                      </div>
                    ))}
                  </div>

                  {/* Theme Mode Buttons */}
                  <div className={styles.themeModesGrid}>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`${styles.themeModeOptionBtn} ${theme === "dark" ? styles.themeModeOptionBtnActive : ""}`}
                    >
                      <Moon size={14} /> Pitch Dark
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("dim")}
                      className={`${styles.themeModeOptionBtn} ${theme === "dim" ? styles.themeModeOptionBtnActive : ""}`}
                    >
                      <Shield size={14} /> Dim Navy
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`${styles.themeModeOptionBtn} ${theme === "light" ? styles.themeModeOptionBtnActive : ""}`}
                    >
                      <Sun size={14} /> Light Mode
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Embedded Auth Form */}
        <div className={styles.authCol}>
          <div id="auth-card" className={styles.authCard}>
            <div className={styles.authTabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${authMode === "login" ? styles.activeTab : ""}`}
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${authMode === "register" ? styles.activeTab : ""}`}
                onClick={() => {
                  setAuthMode("register");
                  setError("");
                }}
              >
                Create Account
              </button>
            </div>

            <div className={styles.authFormWrapper}>
              <h2 className={styles.authTitle}>
                {authMode === "login" ? "Welcome Back" : "Join DOST Today"}
              </h2>
              <p className={styles.authSubtitle}>
                {authMode === "login"
                  ? "Access your feed, stories & messages."
                  : "Get started with your free social account."}
              </p>

              {error && (
                <div className={styles.errorBanner}>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className={styles.formElement}>
                {authMode === "register" && (
                  <div className={styles.inputField}>
                    <label htmlFor="name">Full Name</label>
                    <div className={styles.inputWrapper}>
                      <User size={18} className={styles.inputIcon} />
                      <input
                        id="name"
                        type="text"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={styles.textInput}
                      />
                    </div>
                  </div>
                )}

                <div className={styles.inputField}>
                  <label htmlFor="email">
                    {authMode === "login" ? "Email or Username" : "Email Address"}
                  </label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input
                      id="email"
                      type={authMode === "login" ? "text" : "email"}
                      placeholder={authMode === "login" ? "e.g. sumit or sumit@gmail.com" : "name@example.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={styles.textInput}
                    />
                  </div>
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="password">Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={styles.textInput}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className={styles.submitBtn}>
                  {isLoading ? (
                    <Loader2 className={styles.spinner} size={20} />
                  ) : (
                    <>
                      <span>{authMode === "login" ? "Sign In" : "Get Started"}</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className={styles.authToggleFooter}>
                  {authMode === "login" ? (
                    <p>
                      New to DOST?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("register");
                          setError("");
                        }}
                        className={styles.toggleTextLink}
                      >
                        Create Account
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setError("");
                        }}
                        className={styles.toggleTextLink}
                      >
                        Sign In
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO GRID: APP FEATURE HIGHLIGHTS */}
      <section className={styles.bentoSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Everything You Need To Connect & Share</h2>
          <p className={styles.sectionSubtitle}>
            Packed with modern social features designed for speed, beauty, and privacy.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {/* Card 1: X-Style Rich Timeline Feed */}
          <div className={`${styles.bentoItem} ${styles.colSpan2}`}>
            <div className={styles.bentoIconWrapper}>
              <Sparkles size={24} />
            </div>
            <div className={styles.bentoContent}>
              <h3>Next-Gen Interactive Timeline</h3>
              <p>
                Post text, code snippets, poll questions, videos, and photos. Enjoy threaded replies, quote posts, reposts, and like burst particle animations.
              </p>
            </div>
            <div className={styles.feedPreviewVisual}>
              <div className={styles.visualCard}>
                <div className={styles.userBadge}></div>
                <div className={styles.lineLong}></div>
                <div className={styles.lineShort}></div>
                <div className={styles.visualMedia}></div>
              </div>
            </div>
          </div>

          {/* Card 2: 24h Visual Stories */}
          <div className={styles.bentoItem}>
            <div className={styles.bentoIconWrapper}>
              <Flame size={24} style={{ color: "#f59e0b" }} />
            </div>
            <div className={styles.bentoContent}>
              <h3>24-Hour Stories & Polls</h3>
              <p>Share ephemeral stories with background music, sticker overlays, and interactive polls.</p>
            </div>
            <div className={styles.chatPreviewVisual}>
              <div className={styles.bubbleLeft}>📊 Live Story Polls</div>
              <div className={styles.bubbleRight}>72% Voted Yes! 🔥</div>
            </div>
          </div>

          {/* Card 3: Topic Communities */}
          <div className={styles.bentoItem}>
            <div className={styles.bentoIconWrapper}>
              <Hash size={24} style={{ color: "#8b5cf6" }} />
            </div>
            <div className={styles.bentoContent}>
              <h3>Dedicated Communities</h3>
              <p>Join or build specialized groups for Software Engineers, Creators, Designers & Tech Startups.</p>
            </div>
            <div className={styles.explorePreviewVisual}>
              <span className={styles.trendTag}>#software_dev</span>
              <span className={styles.trendTag}>#digital_creator</span>
              <span className={styles.trendTag}>#tech_startup</span>
            </div>
          </div>

          {/* Card 4: Privacy & Safety Shield */}
          <div className={`${styles.bentoItem} ${styles.colSpan2}`}>
            <div className={styles.bentoIconWrapper}>
              <ShieldCheck size={24} style={{ color: "#10b981" }} />
            </div>
            <div className={styles.bentoContent}>
              <h3>Granular Privacy & Safety Shield</h3>
              <p>
                Private accounts, custom block & mute controls, close friends story privacy, 2FA security, and unrecognized login alerts.
              </p>
            </div>
            <div className={styles.shieldPreviewVisual}>
              <ShieldCheck size={72} className={styles.shieldIconBig} />
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className={styles.ctaBannerSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Experience DOST?</h2>
            <p className={styles.ctaDesc}>
              Join thousands of creators, software engineers, and friends sharing updates today.
            </p>
            <button onClick={() => scrollToAuth("register")} className={styles.ctaBtn}>
              Create Free Account <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <span className={styles.footerLogo}>DOST</span>
          <p className={styles.footerCopyright}>© {new Date().getFullYear()} DOST Social Network. All rights reserved.</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/settings">Privacy & Security</Link>
          <Link href="/settings">Terms & Guidelines</Link>
          <Link href="/settings">Help Center</Link>
        </div>
      </footer>
    </main>
  );
}
