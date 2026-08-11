"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Server, UserCheck, HelpCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function PrivacyPage() {
  const lastUpdated = "August 11, 2026";

  return (
    <AppLayout>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <Link 
            href="/feed" 
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "38px", height: "38px", borderRadius: "50%",
              background: "var(--color-bg-hover)", color: "var(--color-text-main)",
              transition: "background 0.2s"
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              Privacy Policy
            </h1>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Last updated: {lastUpdated}
            </span>
          </div>
        </div>

        {/* Hero Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(29, 155, 240, 0.12), rgba(0, 198, 255, 0.05))",
          border: "1px solid rgba(29, 155, 240, 0.3)",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "32px",
          display: "flex",
          alignItems: "flex-start",
          gap: "16px"
        }}>
          <div style={{
            background: "var(--color-primary)", color: "white",
            padding: "12px", borderRadius: "14px", display: "flex", flexShrink: 0
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 6px" }}>
              Your Privacy is Fundamental to DOST
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
              At DOST, we believe in radical transparency. We design our social platform to give you full control over your personal data, content visibility, and account security.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          <section style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Eye size={22} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                1. Information We Collect
              </h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 12px" }}>
              We collect information to provide a better, safer social experience:
            </p>
            <ul style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, paddingLeft: "20px", margin: 0 }}>
              <li><strong>Account Credentials:</strong> Username, email address, display name, and securely hashed passwords (stored with industry-standard bcrypt encryption).</li>
              <li><strong>Profile Details:</strong> Profile picture, bio, cover image, links, and verification status.</li>
              <li><strong>User Content:</strong> Posts, threads, media uploads (images/videos), polls, stories, comments, likes, and bookmarks.</li>
              <li><strong>Direct Messages:</strong> Messages sent in private one-on-one chats and audio/video call signals.</li>
              <li><strong>Usage & Analytics:</strong> Aggregate page views and interactions via privacy-first Vercel Analytics.</li>
            </ul>
          </section>

          <section style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Lock size={22} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                2. How We Protect Your Data
              </h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              DOST utilizes SSL/TLS encryption in transit and PostgreSQL encrypted storage at rest. Authentication uses secure HTTP-Only JWT tokens, preventing XSS and unauthorized credential access. We never sell your personal data to third parties.
            </p>
          </section>

          <section style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Server size={22} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                3. AI Content Moderation
              </h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              Public posts and comments undergo automated AI moderation checks to detect spam, hate speech, and harmful material. Content moderation logs are stored anonymously solely for platform safety.
            </p>
          </section>

          <section style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <UserCheck size={22} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                4. Your Rights & Controls
              </h3>
            </div>
            <ul style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, paddingLeft: "20px", margin: 0 }}>
              <li><strong>Edit & Delete:</strong> You can edit or delete your posts, comments, and profile information at any time.</li>
              <li><strong>Account Deletion:</strong> You have the right to request permanent account deletion by contacting support.</li>
              <li><strong>Privacy Settings:</strong> Control who can view your content and send direct messages.</li>
            </ul>
          </section>

          {/* Contact footer */}
          <div style={{
            textAlign: "center", padding: "24px",
            background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--color-border)",
            borderRadius: "18px"
          }}>
            <HelpCircle size={28} style={{ color: "var(--color-primary)", marginBottom: "8px" }} />
            <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 4px" }}>
              Questions about Privacy?
            </h4>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 12px" }}>
              Reach out to our privacy team anytime at privacy@dostapp.com
            </p>
            <Link href="/help" style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
              Visit Help Center &rarr;
            </Link>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
