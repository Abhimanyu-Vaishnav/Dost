"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Loader2 } from "lucide-react";

export function TrendingSection() {
  const [trends, setTrends] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch("/api/trends");
        if (res.ok) {
          const data = await res.json();
          setTrends(data.trends);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  return (
    <div className="glass" style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)", marginBottom: "var(--space-6)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <TrendingUp size={20} style={{ color: "var(--color-primary)" }} />
        <h3 className="text-h3" style={{ fontSize: "1.2rem" }}>What's Happening</h3>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
        </div>
      ) : trends.length === 0 ? (
        <p className="text-muted" style={{ fontSize: "0.9rem", textAlign: "center" }}>No trends yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {trends.map((trend) => (
            <Link 
              key={trend.tag} 
              href={`/hashtag/${trend.tag}`}
              style={{ textDecoration: "none", color: "inherit" }}
              className="hover-bg-subtle"
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Trending</span>
                <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--color-text-main)" }}>#{trend.tag}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{trend.count} {trend.count === 1 ? "post" : "posts"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
