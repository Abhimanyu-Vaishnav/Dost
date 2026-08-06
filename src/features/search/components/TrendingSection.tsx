"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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
    <div style={{
      padding: "16px",
      borderRadius: "16px",
      border: "1px solid var(--color-border)",
      backgroundColor: "var(--color-bg-surface)",
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    }}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
        What's happening
      </h3>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
        </div>
      ) : trends.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>No trends right now</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {trends.map((trend) => (
            <Link 
              key={trend.tag} 
              href={`/hashtag/${trend.tag}`}
              style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Trending in Tech</span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text-main)" }}>#{trend.tag}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{trend.count} {trend.count === 1 ? "post" : "posts"}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

