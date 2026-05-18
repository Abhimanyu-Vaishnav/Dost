"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { Shield, Zap, Image as ImageIcon, Users, Globe, ArrowRight, Star, Heart } from "lucide-react";
import { AuthModal } from "@/features/auth/components/AuthModal";

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);

  return (
    <main className={styles.landingContainer}>
      <div className={styles.meshGradient} />
      
      {/* Decorative Floating Elements */}
      <div style={{ position: "fixed", top: "15%", left: "10%", opacity: 0.1, zIndex: 0 }} className="animate-float">
        <Star size={120} fill="var(--color-primary)" color="var(--color-primary)" />
      </div>
      <div style={{ position: "fixed", bottom: "15%", right: "10%", opacity: 0.1, zIndex: 0, animationDelay: "2s" }} className="animate-float">
        <Heart size={100} fill="var(--color-primary)" color="var(--color-primary)" />
      </div>

      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>DOST</div>
        <div className={styles.navLinks}>
          <button onClick={() => setAuthMode("login")} style={{ fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-main)" }}>Sign In</button>
          <button onClick={() => setAuthMode("register")} className={styles.secondaryBtn} style={{ padding: '10px 24px', fontSize: '1rem', cursor: "pointer" }}>
            Join Now
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="animate-fade-in">
          <div style={{ 
            display: "inline-flex", alignItems: "center", gap: "8px", 
            padding: "8px 20px", borderRadius: "99px", background: "rgba(29, 155, 240, 0.1)",
            color: "var(--color-primary)", fontWeight: 700, fontSize: "0.9rem", marginBottom: "32px"
          }}>
            <Zap size={16} /> Beta Version 2.0 is live!
          </div>
          <h1 className={styles.heroTitle}>Socializing <br /> Reimagined.</h1>
          <p className={styles.heroSubtitle}>
            A secure, modern, and high-performance social network built for the next generation of digital connections.
          </p>
          <div className={styles.ctaGroup}>
            <button onClick={() => setAuthMode("register")} className={styles.primaryBtn} style={{ border: "none", cursor: "pointer" }}>
              Start for free <ArrowRight size={20} style={{ marginLeft: 8 }} />
            </button>
            <button onClick={() => setAuthMode("login")} className={styles.secondaryBtn} style={{ cursor: "pointer" }}>
              Already a member?
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className={styles.bentoGrid}>
        <div className={`${styles.bentoItem} ${styles.large} animate-slide-up`} style={{ animationDelay: '0.1s' }}>
          <img src="/hero-visual.png" className={styles.visualBg} alt="" />
          <div className={styles.bentoIcon}><Globe size={32} /></div>
          <h3 className={styles.bentoTitle}>Global Reach</h3>
          <p className={styles.bentoText}>Real-time global interactions without boundaries.</p>
        </div>

        <div className={`${styles.bentoItem} animate-slide-up`} style={{ animationDelay: '0.2s' }}>
          <div className={styles.bentoIcon}><Shield size={32} /></div>
          <h3 className={styles.bentoTitle}>Private & Safe</h3>
          <p className={styles.bentoText}>Your data, your control. State-of-the-art privacy tools.</p>
        </div>

        <div className={`${styles.bentoItem} animate-slide-up`} style={{ animationDelay: '0.3s' }}>
          <div className={styles.bentoIcon}><Zap size={32} /></div>
          <h3 className={styles.bentoTitle}>Pure Speed</h3>
          <p className={styles.bentoText}>Next-gen performance with Turbopack acceleration.</p>
        </div>

        <div className={`${styles.bentoItem} animate-slide-up`} style={{ animationDelay: '0.4s' }}>
          <div className={styles.bentoIcon}><ImageIcon size={32} /></div>
          <h3 className={styles.bentoTitle}>HD Media</h3>
          <p className={styles.bentoText}>Share life in stunning clarity with HD media support.</p>
        </div>

        <div className={`${styles.bentoItem} ${styles.large} animate-slide-up`} style={{ animationDelay: '0.5s' }}>
          <div className={styles.bentoIcon}><Users size={32} /></div>
          <h3 className={styles.bentoTitle}>Community First</h3>
          <p className={styles.bentoText}>Built for people, by people. Join 10k+ active users.</p>
        </div>
      </section>

      {/* Footer-like CTA */}
      <section style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(29, 155, 240, 0.03)' }}>
        <h2 className="text-h2" style={{ marginBottom: 24, fontWeight: 900 }}>Your social life, evolved.</h2>
        <button onClick={() => setAuthMode("register")} className={styles.primaryBtn} style={{ border: "none", cursor: "pointer" }}>
          Get Your Invite
        </button>
      </section>

      {/* Auth Modal Overlay */}
      {authMode && (
        <AuthModal 
          initialMode={authMode} 
          onClose={() => setAuthMode(null)} 
        />
      )}
    </main>
  );
}
