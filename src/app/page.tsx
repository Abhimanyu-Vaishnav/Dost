"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { 
  Shield, 
  Zap, 
  Image as ImageIcon, 
  Users, 
  Globe, 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  Loader2, 
  Sparkles, 
  MessageSquare, 
  Hash, 
  ShieldCheck 
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [registerStep, setRegisterStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = () => {
    if (email && password.length >= 6) {
      setError("");
      setRegisterStep(2);
    } else if (password.length < 6) {
      setError("Password must be at least 6 characters long");
    } else {
      setError("Please fill in all fields");
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = authMode === "login" ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error(`Server returned non-JSON response (${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      router.push("/feed");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      if (authMode === "register") {
        setRegisterStep(1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.landingContainer}>
      {/* Dynamic abstract background visual lines */}
      <div className={styles.bgGridPattern} />
      <div className={styles.meshGradient} />

      {/* Header / Navbar */}
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Sparkles size={24} />
          </div>
          <span className={styles.logoText}>DOST</span>
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={() => {
              setAuthMode("login");
              setError("");
              setTimeout(() => {
                const el = document.getElementById("auth-card");
                if (el) {
                  try {
                    el.scrollIntoView({ behavior: "smooth" });
                  } catch (e) {
                    el.scrollIntoView();
                  }
                }
              }, 50);
            }}
            className={styles.headerLink}
          >
            Sign In
          </button>
          <button 
            onClick={() => {
              setAuthMode("register");
              setRegisterStep(1);
              setError("");
              setTimeout(() => {
                const el = document.getElementById("auth-card");
                if (el) {
                  try {
                    el.scrollIntoView({ behavior: "smooth" });
                  } catch (e) {
                    el.scrollIntoView();
                  }
                }
              }, 50);
            }}
            className={styles.headerBtn}
          >
            Join Now
          </button>
        </div>
      </header>

      {/* Hero / Auth Section (Split Pane on Desktop) */}
      <section className={styles.heroSplitSection}>
        {/* Left Column: Premium Branding & Live Previews */}
        <div className={styles.brandingCol}>
          <div className={styles.brandingBadge}>
            <Zap size={14} className={styles.iconYellow} />
            <span>The next generation of digital connection</span>
          </div>
          <h1 className={styles.brandingTitle}>
            Where conversations <br />
            <span className={styles.gradientText}>happen naturally.</span>
          </h1>
          <p className={styles.brandingSubtitle}>
            A beautifully designed, secure, and lightning-fast social space built for meaningful updates and private discussions.
          </p>

          {/* Social Proof Badges */}
          <div className={styles.badgeRow}>
            <div className={styles.badgeCard}>
              <Users size={18} />
              <div>
                <span className={styles.badgeNum}>10k+</span>
                <span className={styles.badgeLabel}>Active Members</span>
              </div>
            </div>
            <div className={styles.badgeCard}>
              <ShieldCheck size={18} />
              <div>
                <span className={styles.badgeNum}>Secure</span>
                <span className={styles.badgeLabel}>Privacy Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Mini Interactive Preview Area */}
          <div className={styles.interactivePreview}>
            <div className={styles.previewHeader}>
              <div className={styles.dotGroup}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </div>
              <span className={styles.previewTitle}>dost.feed</span>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewPost}>
                <div className={styles.previewAvatar}>A</div>
                <div className={styles.previewContent}>
                  <div className={styles.previewUserRow}>
                    <span className={styles.previewName}>Alex Rivera</span>
                    <span className={styles.previewHandle}>@alexr</span>
                  </div>
                  <p className={styles.previewText}>
                    Redesigning the portal today. Loving the clean aesthetics and responsiveness! ✨🚀
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Embedded Form Card */}
        <div className={styles.authCol}>
          <div id="auth-card" className={styles.authCard}>
            <div className={styles.authTabs}>
              <button 
                type="button"
                className={`${styles.tabBtn} ${authMode === "register" ? styles.activeTab : ""}`}
                onClick={() => {
                  setAuthMode("register");
                  setRegisterStep(1);
                  setError("");
                }}
              >
                Create Account
              </button>
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
            </div>

            <div className={styles.authFormWrapper}>
              <h2 className={styles.authTitle}>
                {authMode === "register" 
                  ? registerStep === 1 
                    ? "Join DOST Today" 
                    : "Tell us about you"
                  : "Welcome Back"
                }
              </h2>
              <p className={styles.authSubtitle}>
                {authMode === "register"
                  ? registerStep === 1 
                    ? "Get started with your free secure account." 
                    : "Please enter your full name."
                  : "Access your social feed and messages."
                }
              </p>

              {error && (
                <div className={styles.errorBanner}>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className={styles.formElement}>
                {authMode === "register" && registerStep === 2 ? (
                  /* Step 2: Name Input */
                  <div className={styles.inputField}>
                    <label htmlFor="name">Your Name</label>
                    <div className={styles.inputWrapper}>
                      <User size={18} className={styles.inputIcon} />
                      <input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={styles.textInput}
                      />
                    </div>
                  </div>
                ) : (
                  /* Step 1 or Sign In: Email and Password */
                  <>
                    <div className={styles.inputField}>
                      <label htmlFor="email">Email Address</label>
                      <div className={styles.inputWrapper}>
                        <Mail size={18} className={styles.inputIcon} />
                        <input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
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
                  </>
                )}

                {/* Form Buttons */}
                {authMode === "register" && registerStep === 1 ? (
                  <button 
                    type="button" 
                    onClick={handleNextStep}
                    disabled={!email || password.length < 6}
                    className={styles.submitBtn}
                  >
                    <span>Continue</span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={styles.submitBtn}
                  >
                    {isLoading ? (
                      <Loader2 className={styles.spinner} size={20} />
                    ) : (
                      <>
                        <span>{authMode === "login" ? "Sign In" : "Register"}</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                )}

                {/* Switch back link (register step 2) */}
                {authMode === "register" && registerStep === 2 && (
                  <button 
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className={styles.backStepBtn}
                  >
                    Back to step 1
                  </button>
                )}

                {/* Inline Toggle Link for Mobile/Tablets */}
                <div className={styles.authToggleFooter}>
                  {authMode === "login" ? (
                    <p>
                      New to DOST?{" "}
                      <button 
                        type="button" 
                        onClick={() => {
                          setAuthMode("register");
                          setRegisterStep(1);
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

      {/* Bento Grid Features Section */}
      <section className={styles.bentoSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built for the modern digital era</h2>
          <p className={styles.sectionSubtitle}>Simple, elegant, and packed with everything you need to stay connected.</p>
        </div>

        <div className={styles.bentoGrid}>
          {/* Feature 1: Real-time Feed */}
          <div className={`${styles.bentoItem} ${styles.colSpan2}`}>
            <div className={styles.bentoIconWrapper}>
              <Sparkles size={24} />
            </div>
            <div className={styles.bentoContent}>
              <h3>Next-Gen Feed</h3>
              <p>Explore real-time posts, rich media attachments, and interactive comments. Clean design with absolutely no ads.</p>
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

          {/* Feature 2: Secure Chats */}
          <div className={styles.bentoItem}>
            <div className={styles.bentoIconWrapper}>
              <MessageSquare size={24} />
            </div>
            <div className={styles.bentoContent}>
              <h3>Direct Messaging</h3>
              <p>Instant personal messaging with custom thread options to talk to friends securely.</p>
            </div>
            <div className={styles.chatPreviewVisual}>
              <div className={styles.bubbleLeft}>Hey, did you see this?</div>
              <div className={styles.bubbleRight}>Yes, looks clean! 🚀</div>
            </div>
          </div>

          {/* Feature 3: Global Explore */}
          <div className={styles.bentoItem}>
            <div className={styles.bentoIconWrapper}>
              <Hash size={24} />
            </div>
            <div className={styles.bentoContent}>
              <h3>Topic Explore</h3>
              <p>Filter posts by popular trends and browse content categories with clean search navigation.</p>
            </div>
            <div className={styles.explorePreviewVisual}>
              <span className={styles.trendTag}>#nextjs</span>
              <span className={styles.trendTag}>#uiux</span>
              <span className={styles.trendTag}>#coding</span>
            </div>
          </div>

          {/* Feature 4: Safety & Shield */}
          <div className={`${styles.bentoItem} ${styles.colSpan2}`}>
            <div className={styles.bentoIconWrapper}>
              <Shield size={24} />
            </div>
            <div className={styles.bentoContent}>
              <h3>Privacy Controls</h3>
              <p>Take charge of your profile presence. Block users, choose who can interact with you, and keep control of your posts.</p>
            </div>
            <div className={styles.shieldPreviewVisual}>
              <ShieldCheck size={72} className={styles.shieldIconBig} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <span className={styles.footerLogo}>DOST</span>
          <p className={styles.footerCopyright}>© {new Date().getFullYear()} DOST. All rights reserved.</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/about">About</Link>
        </div>
      </footer>
    </main>
  );
}
