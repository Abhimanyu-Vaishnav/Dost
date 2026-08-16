"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Flame, TrendingUp, Hash, MapPin, ChevronRight, MoreHorizontal, Globe } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrendingTopic {
  id: string;
  category: string;
  title: string;
  postCount: number;
  isBreaking: boolean;
  searchQuery: string;
}

interface HashtagTrend {
  tag: string;
  count: number;
  category: string;
  isRegional: boolean;
}

interface Region { code: string; name: string; }

// ── Helper ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}

// ── Sidebar Widget ────────────────────────────────────────────────────────────

export function TrendingSection() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [hashtags, setHashtags] = useState<HashtagTrend[]>([]);
  const [region, setRegion] = useState("IN");
  const [regionName, setRegionName] = useState("India");
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const fetchTrends = async (reg: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/trends?region=${reg}`);
      const data = await r.json();
      setTopics((data.topics || []).slice(0, 5));
      setHashtags((data.hashtags || []).slice(0, 4));
      setRegionName(data.region || reg);
      if (data.regions?.length) setRegions(data.regions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrends(region); }, [region]);

  const hasData = topics.length > 0 || hashtags.length > 0;

  return (
    <div style={{
      borderRadius: "18px",
      border: "1px solid var(--color-border)",
      backgroundColor: "var(--color-bg-surface)",
      overflow: "hidden",
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{
            fontSize: "1.1rem", fontWeight: 900,
            color: "var(--color-text-main)", margin: 0,
            display: "flex", alignItems: "center", gap: "7px",
          }}>
            <Flame size={19} style={{ color: "var(--color-primary)" }} />
            What&apos;s happening
          </h3>

          {/* Location pill + picker */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowRegionPicker(!showRegionPicker)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                background: "rgba(29,155,240,0.08)", border: "1px solid rgba(29,155,240,0.2)",
                borderRadius: "999px", padding: "4px 10px",
                fontSize: "0.72rem", fontWeight: 700, color: "var(--color-primary)",
                cursor: "pointer",
              }}
            >
              <MapPin size={11} />
              {regionName}
            </button>

            {showRegionPicker && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  onClick={() => setShowRegionPicker(false)}
                />
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0,
                  background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
                  borderRadius: "12px", padding: "4px", zIndex: 50,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.25)", minWidth: "160px",
                  maxHeight: "260px", overflowY: "auto",
                }}>
                  <button
                    onClick={() => { setRegion("WW"); setShowRegionPicker(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "7px",
                      width: "100%", padding: "8px 10px",
                      background: region === "WW" ? "rgba(29,155,240,0.1)" : "none",
                      border: "none", borderRadius: "8px", cursor: "pointer",
                      color: region === "WW" ? "var(--color-primary)" : "var(--color-text-main)",
                      fontSize: "0.82rem", fontWeight: 600, textAlign: "left",
                    }}
                  >
                    <Globe size={13} /> Worldwide
                  </button>
                  {regions.filter(r => r.code !== "WW").map((r) => (
                    <button
                      key={r.code}
                      onClick={() => { setRegion(r.code); setShowRegionPicker(false); }}
                      style={{
                        width: "100%", padding: "8px 10px",
                        background: region === r.code ? "rgba(29,155,240,0.1)" : "none",
                        border: "none", borderRadius: "8px", cursor: "pointer",
                        color: region === r.code ? "var(--color-primary)" : "var(--color-text-main)",
                        fontSize: "0.82rem", fontWeight: region === r.code ? 700 : 500,
                        textAlign: "left",
                      }}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "26px" }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
        </div>
      ) : !hasData ? (
        <div style={{ padding: "24px 18px", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>
            No trends yet for {regionName}.
          </p>
        </div>
      ) : (
        <>
          {/* ── Topics ── */}
          {topics.map((topic, idx) => (
            <Link
              key={topic.id}
              href={`/search?q=${encodeURIComponent(topic.searchQuery)}`}
              style={{
                display: "block", textDecoration: "none", color: "inherit",
                padding: "12px 18px",
                borderBottom: "1px solid var(--color-border)",
                transition: "background 0.15s",
              }}
              className="hover-bg"
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                    {topic.isBreaking && (
                      <span style={{
                        background: "linear-gradient(135deg,#ef4444,#f97316)",
                        color: "white", fontSize: "0.58rem", fontWeight: 900,
                        padding: "1px 5px", borderRadius: "3px",
                      }}>LIVE</span>
                    )}
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                      {topic.category} · Trending
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "0.93rem", color: "var(--color-text-main)", lineHeight: 1.3, marginBottom: "3px" }}>
                    {topic.title}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                    <TrendingUp size={11} style={{ color: "var(--color-primary)" }} />
                    {fmt(topic.postCount)} posts
                  </div>
                </div>
                <MoreHorizontal size={15} style={{ color: "var(--color-text-muted)", flexShrink: 0, marginTop: "2px" }} />
              </div>
            </Link>
          ))}

          {/* ── Hashtags ── */}
          {hashtags.length > 0 && (
            <div style={{ padding: "10px 18px 8px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "var(--color-text-muted)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                <Hash size={13} style={{ color: "var(--color-primary)" }} />
                Trending Hashtags
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {hashtags.map((h) => (
                  <Link
                    key={h.tag}
                    href={`/hashtag/${encodeURIComponent(h.tag)}`}
                    style={{
                      textDecoration: "none",
                      background: "rgba(29,155,240,0.1)",
                      color: "var(--color-primary)",
                      fontWeight: 700, fontSize: "0.78rem",
                      padding: "4px 10px", borderRadius: "999px",
                      border: "1px solid rgba(29,155,240,0.18)",
                      transition: "background 0.15s",
                    }}
                  >
                    #{h.tag} · {fmt(h.count)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── See all link ── */}
          <Link
            href="/trending"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              textDecoration: "none", padding: "12px 18px",
              color: "var(--color-primary)", fontWeight: 700, fontSize: "0.88rem",
              borderBottom: "1px solid var(--color-border)", transition: "background 0.15s",
            }}
            className="hover-bg"
          >
            Show more trends
            <ChevronRight size={16} />
          </Link>

          {/* ── Footer ── */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "5px 10px",
            fontSize: "0.68rem", color: "var(--color-text-muted)",
            padding: "10px 18px", lineHeight: 1.4,
          }}>
            <Link href="/terms"   style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Terms</Link>
            <Link href="/privacy" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/about"   style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>About</Link>
            <Link href="/help"    style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Help</Link>
            <span>© 2026 DOST, Inc.</span>
          </div>
        </>
      )}
    </div>
  );
}
