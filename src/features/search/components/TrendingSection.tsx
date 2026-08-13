"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Flame, TrendingUp, Zap, Globe, MoreHorizontal } from "lucide-react";

interface TrendingTopic {
  id: string;
  category: string;
  topic: string;
  headline: string;
  posts: number;
  isBreaking: boolean;
}

interface HashtagTrend {
  tag: string;
  count: number;
}

export function TrendingSection() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [hashtags, setHashtags] = useState<HashtagTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch("/api/trends");
        if (res.ok) {
          const data = await res.json();
          setTopics(data.topics || []);
          setHashtags(data.trends || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  const visibleTopics = showAll ? topics : topics.slice(0, 5);

  function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  }

  return (
    <div style={{
      borderRadius: "18px",
      border: "1px solid var(--color-border)",
      backgroundColor: "var(--color-bg-surface)",
      overflow: "hidden"
    }}>
      {/* Section Header */}
      <div style={{ padding: "16px 18px 10px", borderBottom: "1px solid var(--color-border)" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <Flame size={20} style={{ color: "var(--color-primary)" }} />
          What's happening
        </h3>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
          <Loader2 size={22} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
        </div>
      ) : (
        <>
          {/* Trending News Topics */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {visibleTopics.map((topic, idx) => (
              <div
                key={topic.id}
                style={{
                  padding: "14px 18px",
                  borderBottom: idx < visibleTopics.length - 1 ? "1px solid var(--color-border)" : "none",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease"
                }}
                className="hover-bg"
              >
                {/* Category Label Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {topic.isBreaking && (
                      <span style={{
                        background: "linear-gradient(135deg, #ef4444, #f97316)",
                        color: "white",
                        fontSize: "0.62rem",
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        letterSpacing: "0.04em"
                      }}>
                        LIVE
                      </span>
                    )}
                    <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                      {topic.category}
                    </span>
                  </div>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "2px 4px", borderRadius: "50%" }}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Topic Title */}
                <div style={{ fontWeight: 800, fontSize: "0.98rem", color: "var(--color-text-main)", lineHeight: 1.3, marginBottom: "4px" }}>
                  {topic.topic}
                </div>

                {/* Headline Subtext */}
                <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.4, marginBottom: "5px" }}>
                  {topic.headline}
                </div>

                {/* Post Count */}
                <div style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  <TrendingUp size={13} style={{ color: "var(--color-primary)" }} />
                  {formatCount(topic.posts)} posts
                </div>
              </div>
            ))}
          </div>

          {/* Show More / Show Less Toggle */}
          {topics.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                width: "100%",
                padding: "14px 18px",
                background: "none",
                border: "none",
                borderTop: "1px solid var(--color-border)",
                color: "var(--color-primary)",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.15s ease"
              }}
              className="hover-bg"
            >
              {showAll ? "Show less" : `Show ${topics.length - 5} more trends`}
            </button>
          )}

          {/* Trending Hashtags from DB */}
          {hashtags.length > 0 && (
            <div style={{ padding: "12px 18px", borderTop: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--color-text-muted)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Zap size={14} style={{ color: "var(--color-primary)" }} />
                Trending Hashtags
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {hashtags.map(h => (
                  <Link
                    key={h.tag}
                    href={`/hashtag/${h.tag}`}
                    style={{
                      textDecoration: "none",
                      background: "rgba(29, 155, 240, 0.12)",
                      color: "var(--color-primary)",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      padding: "5px 12px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(29, 155, 240, 0.2)",
                      transition: "background-color 0.15s ease"
                    }}
                  >
                    #{h.tag} · {h.count}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "6px 12px",
            fontSize: "0.72rem", color: "var(--color-text-muted)",
            padding: "12px 18px", borderTop: "1px solid var(--color-border)", lineHeight: 1.4
          }}>
            <Link href="/terms" style={{ color: "var(--color-text-muted)", textDecoration: "none" }} className="hover:underline">Terms</Link>
            <Link href="/privacy" style={{ color: "var(--color-text-muted)", textDecoration: "none" }} className="hover:underline">Privacy</Link>
            <Link href="/about" style={{ color: "var(--color-text-muted)", textDecoration: "none" }} className="hover:underline">About DOST</Link>
            <Link href="/help" style={{ color: "var(--color-text-muted)", textDecoration: "none" }} className="hover:underline">Help</Link>
            <span>© 2026 DOST, Inc.</span>
          </div>
        </>
      )}
    </div>
  );
}
