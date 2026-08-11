"use client";

import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Shield, Scale, HelpCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function TermsPage() {
  const lastUpdated = "August 11, 2026";

  return (
    <AppLayout>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Header */}
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
              Terms & Conditions
            </h1>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Effective Date: {lastUpdated}
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
            <Scale size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 6px" }}>
              Welcome to DOST Social Agreement
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
              By creating an account, accessing, or using DOST, you agree to comply with and be bound by these Terms of Service. Please read them carefully.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          <section style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <CheckCircle2 size={22} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                1. User Accounts & Eligibility
              </h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 12px" }}>
              To register for a DOST account, you must be at least 13 years of age. You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account.
            </p>
          </section>

          <section style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <FileText size={22} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                2. Content Ownership & Licensing
              </h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              You retain all ownership rights to the content (posts, images, videos, code blocks) you create on DOST. By publishing content on DOST, you grant us a non-exclusive, worldwide, royalty-free license to display, distribute, and format your content across the platform.
            </p>
          </section>

          <section style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <AlertTriangle size={22} style={{ color: "#ff9800" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                3. Prohibited Conduct & Community Rules
              </h3>
            </div>
            <ul style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, paddingLeft: "20px", margin: 0 }}>
              <li><strong>Hate Speech & Harassment:</strong> Intimidation, cyberbullying, or hate speech against any group or individual is strictly prohibited.</li>
              <li><strong>Spam & Bots:</strong> Automated spamming, scraping, or artificial engagement manipulation is not permitted.</li>
              <li><strong>Malicious Code:</strong> Posting malware, phishing links, or exploits will result in immediate permanent account termination.</li>
              <li><strong>Impersonation:</strong> Impersonating another person, organization, or brand with deceptive intent is prohibited.</li>
            </ul>
          </section>

          <section style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Shield size={22} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                4. Account Termination & Enforcement
              </h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              DOST reserves the right to suspend or terminate accounts that violate our terms or community guidelines without prior notice. Users may appeal account actions via our Help Center.
            </p>
          </section>

          {/* Footer link */}
          <div style={{
            textAlign: "center", padding: "24px",
            background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--color-border)",
            borderRadius: "18px"
          }}>
            <HelpCircle size={28} style={{ color: "var(--color-primary)", marginBottom: "8px" }} />
            <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 4px" }}>
              Have Legal or Policy Questions?
            </h4>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 12px" }}>
              Contact our legal compliance team at legal@dostapp.com
            </p>
            <Link href="/privacy" style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
              Read Privacy Policy &rarr;
            </Link>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
