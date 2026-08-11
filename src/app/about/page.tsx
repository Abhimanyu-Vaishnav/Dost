"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Code2, Users2, Zap, Globe, MessageSquare, ShieldCheck, Heart } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AboutPage() {
  const stats = [
    { label: "Active Creators", value: "23+" },
    { label: "Community Posts", value: "115+" },
    { label: "Realtime Engine", value: "Sub-Second" },
    { label: "Uptime SLA", value: "99.99%" },
  ];

  const features = [
    { icon: <Zap size={24} />, title: "Realtime Infinite Feed", desc: "Twitter/X style non-intrusive stream accumulator with live auto-refresh." },
    { icon: <MessageSquare size={24} />, title: "Direct Messaging & Audio Calls", desc: "Private encrypted chat conversations with realtime typing and webRTC call signaling." },
    { icon: <Code2 size={24} />, title: "Developer First Code Blocks", desc: "Syntax highlighted code snippets natively rendered within posts." },
    { icon: <Globe size={24} />, title: "Algorithmic Smart Feed", desc: "For You recommendations powered by mathematical engagement scoring." },
    { icon: <ShieldCheck size={24} />, title: "AI Moderation & Privacy", desc: "Automated content protection and strict environment security." },
    { icon: <Users2 size={24} />, title: "Communities & Spaces", desc: "Dedicated spaces for tech, design, startups, fitness, and gaming." },
  ];

  return (
    <AppLayout>
      <div style={{ maxWidth: "840px", margin: "0 auto", padding: "24px 20px 80px" }}>
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
              About DOST
            </h1>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Building the next generation of authentic social connection
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{
          background: "linear-gradient(135deg, rgba(29, 155, 240, 0.15), rgba(0, 198, 255, 0.08))",
          border: "1px solid rgba(29, 155, 240, 0.3)",
          borderRadius: "24px",
          padding: "36px 28px",
          marginBottom: "36px",
          textAlign: "center"
        }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "18px",
            background: "linear-gradient(135deg, var(--color-primary), #00c6ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 900, fontSize: "2rem", margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(29, 155, 240, 0.4)"
          }}>
            D
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--color-text-main)", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Re-imagining Social Networks for Modern Creators
          </h2>
          <p style={{ fontSize: "1.05rem", color: "var(--color-text-muted)", margin: "0 auto", maxWidth: "620px", lineHeight: 1.6 }}>
            DOST is a state-of-the-art social media platform engineered with Next.js 16, Prisma, Neon PostgreSQL, and real-time streaming to empower seamless conversations, rich media sharing, and developer communities.
          </p>

          {/* Stats Bar */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "16px",
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            {stats.map((stat, idx) => (
              <div key={idx} style={{ textAlign: "center" }}>
                <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--color-primary)", display: "block" }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "20px" }}>
          Platform Highlights
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "40px"
        }}>
          {features.map((feat, i) => (
            <div key={i} style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "20px",
              padding: "24px",
              transition: "transform 0.2s, border-color 0.2s"
            }}>
              <div style={{ color: "var(--color-primary)", marginBottom: "14px" }}>
                {feat.icon}
              </div>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 6px" }}>
                {feat.title}
              </h4>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Tech Stack Banner */}
        <div style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          padding: "28px",
          marginBottom: "40px"
        }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 12px" }}>
            🚀 Technology Stack
          </h3>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
            DOST is built on top of high-performance modern web technologies:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {["Next.js 16 (App Router)", "TypeScript", "Prisma ORM", "Neon Serverless PostgreSQL", "Vercel Analytics", "WebSockets / SSE", "Bcrypt Security", "Vanilla CSS Tokens"].map((tech, tIdx) => (
              <span key={tIdx} style={{
                background: "rgba(29, 155, 240, 0.08)",
                border: "1px solid rgba(29, 155, 240, 0.2)",
                color: "var(--color-primary)",
                padding: "6px 14px",
                borderRadius: "99px",
                fontSize: "0.85rem",
                fontWeight: 600
              }}>
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--color-border)", borderRadius: "18px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            <span>Made with</span>
            <Heart size={16} style={{ color: "#ff4d4d", fill: "#ff4d4d" }} />
            <span>for global creators</span>
          </div>

          <div style={{ display: "flex", gap: "16px", fontSize: "0.9rem", fontWeight: 600 }}>
            <Link href="/privacy" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Terms</Link>
            <Link href="/help" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Help</Link>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
