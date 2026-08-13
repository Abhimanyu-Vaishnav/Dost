"use client";

import { useState } from "react";
import { 
  BarChart3, Eye, TrendingUp, DollarSign, Users, ArrowUpRight, 
  Sparkles, Calendar, Filter, Share2, Heart, MessageCircle, Repeat 
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

const TOP_POSTS_DATA = [
  {
    id: "p1",
    content: "Completed another 3D motion loop render in Blender! Check out the ambient lighting ✨ #3d #blender",
    impressions: "38,420",
    likes: "3,840",
    reposts: "412",
    tipsEarned: "$124.00"
  },
  {
    id: "p2",
    content: "Just launched another optimization on DOST! Lightning fast response times and glassmorphic UI 🚀",
    impressions: "29,150",
    likes: "2,910",
    reposts: "305",
    tipsEarned: "$85.50"
  },
  {
    id: "p3",
    content: "Building custom audio spaces with real-time WebSockets and Web Audio API 🎙️ #nextjs #fullstack",
    impressions: "22,800",
    likes: "1,980",
    reposts: "189",
    tipsEarned: "$62.00"
  }
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  return (
    <AppLayout>
      <div style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxWidth: "1000px",
        margin: "0 auto",
        width: "100%"
      }}>
        {/* Header Title & Filter Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <BarChart3 size={28} style={{ color: "var(--color-primary)" }} />
              Creator Analytics Dashboard
            </h1>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Track your impressions, audience growth, engagement rates, and creator tip revenue.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "var(--color-bg-surface)", padding: "4px", borderRadius: "9999px", border: "1px solid var(--color-border)" }}>
            {["7d", "30d", "90d"].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  border: "none",
                  background: timeRange === range ? "var(--color-primary)" : "transparent",
                  color: timeRange === range ? "white" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "Last 90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Stat Overview Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px"
        }}>
          {/* Impressions */}
          <div style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Total Impressions</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(29, 155, 240, 0.15)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Eye size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--color-text-main)" }}>142,850</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.8rem", fontWeight: 700 }}>
              <ArrowUpRight size={16} /> +18.4% from last period
            </div>
          </div>

          {/* Profile Visits */}
          <div style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Profile Visits</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(168, 85, 247, 0.15)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--color-text-main)" }}>8,420</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.8rem", fontWeight: 700 }}>
              <ArrowUpRight size={16} /> +12.1% profile clicks
            </div>
          </div>

          {/* Engagement Rate */}
          <div style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Engagement Rate</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(236, 72, 153, 0.15)", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--color-text-main)" }}>8.45%</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.8rem", fontWeight: 700 }}>
              <ArrowUpRight size={16} /> +2.3% above benchmark
            </div>
          </div>

          {/* Tip Revenue */}
          <div style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Creator Tip Revenue</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--color-text-main)" }}>$648.50</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.8rem", fontWeight: 700 }}>
              <ArrowUpRight size={16} /> +$140.00 this month
            </div>
          </div>
        </div>

        {/* Impression & Engagement Visualizer Graph */}
        <div style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "24px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                Impression & Reach Growth Trend
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Daily views across posts, audio spaces & video shorts</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.8rem", fontWeight: 700 }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-primary)" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-primary)" }} /> Impressions
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ec4899" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ec4899" }} /> Engagements
              </span>
            </div>
          </div>

          {/* SVG Animated Chart Curve */}
          <div style={{ width: "100%", height: "180px", position: "relative", marginTop: "10px" }}>
            <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area Fill */}
              <path
                d="M 0,130 Q 80,40 160,80 T 320,30 T 500,10 L 500,150 L 0,150 Z"
                fill="url(#primaryGrad)"
              />
              {/* Line Stroke Primary */}
              <path
                d="M 0,130 Q 80,40 160,80 T 320,30 T 500,10"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Line Stroke Secondary Pink */}
              <path
                d="M 0,140 Q 80,90 160,110 T 320,70 T 500,45"
                fill="none"
                stroke="#ec4899"
                strokeWidth="2.5"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
        </div>

        {/* Top Performing Posts Breakdown */}
        <div style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "24px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
            Top Performing Content
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {TOP_POSTS_DATA.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-base)",
                  gap: "16px",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "240px" }}>
                  <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--color-primary)" }}>#{idx + 1}</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--color-text-main)", fontWeight: 600 }}>
                    {item.content}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Eye size={15} style={{ color: "var(--color-primary)" }} /> {item.impressions}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Heart size={15} style={{ color: "#f91880" }} /> {item.likes}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Repeat size={15} style={{ color: "#00ba7c" }} /> {item.reposts}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981" }}>
                    <DollarSign size={15} /> {item.tipsEarned}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
