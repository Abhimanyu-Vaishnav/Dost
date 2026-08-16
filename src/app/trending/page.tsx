"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBar } from "@/features/search/components/SearchBar";
import { PostCard } from "@/features/posts/components/PostCard";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";
import {
  Flame, Hash, TrendingUp, MapPin, ChevronDown, MoreHorizontal,
  RefreshCw, Globe, Loader2, Sparkles, Newspaper, Trophy, Tv, Landmark,
  Briefcase, Zap, X, Bot, Play, Image as ImageIcon, Video
} from "lucide-react";

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

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}

const CATEGORY_TABS = [
  { id: "all", label: "For You", icon: Sparkles },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "shorts", label: "Shorts & Media", icon: Video },
  { id: "news", label: "News", icon: Newspaper },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "entertainment", label: "Entertainment", icon: Tv },
  { id: "politics", label: "Politics", icon: Landmark },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "technology", label: "Tech", icon: Zap },
];

export default function TrendingPage() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [hashtags, setHashtags] = useState<HashtagTrend[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [region, setRegion] = useState("IN");
  const [regionName, setRegionName] = useState("India");
  const [activeTab, setActiveTab] = useState("all");
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  // AI Summary Modal state
  const [selectedAiTopic, setSelectedAiTopic] = useState<string | null>(null);
  const [aiSummaryData, setAiSummaryData] = useState<{ summary: string[]; sentiment: string } | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);

  // Live Score Ticker State
  const [liveTicker, setLiveTicker] = useState<{ title: string; score: string; badge: string }>({
    title: "India vs Australia 3rd T20I",
    score: "IND 184/4 (18.2 ov) · Hype 98%",
    badge: "LIVE SCORE"
  });

  // Feed/Posts state for infinite scroll
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [skip, setSkip] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch Current User
  useEffect(() => {
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.id) setCurrentUserId(data.user.id);
      })
      .catch(console.error);
  }, []);

  // Fetch AI Summary
  const handleOpenAiSummary = async (topicTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAiTopic(topicTitle);
    setLoadingAiSummary(true);
    setAiSummaryData(null);

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicTitle, action: "summary" })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummaryData({ summary: data.summary, sentiment: data.sentiment });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAiSummary(false);
    }
  };

  // Fetch Trends summary
  const fetchTrendsData = useCallback(async (reg: string, cat: string) => {
    setLoadingTrends(true);
    try {
      const params = new URLSearchParams({ region: reg });
      if (cat !== "all" && cat !== "shorts") params.set("category", cat);
      const r = await fetch(`/api/trends?${params}`);
      const data = await r.json();
      setTopics(data.topics || []);
      setHashtags(data.hashtags || []);
      setRegionName(data.region || reg);
      if (data.regions?.length) setRegions(data.regions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  // Fetch Posts for Infinite Scroll
  const fetchPostsData = useCallback(async (reset = false) => {
    if (loadingPosts) return;
    setLoadingPosts(true);
    const currentSkip = reset ? 0 : skip;
    try {
      const params = new URLSearchParams({
        tab: "for-you",
        take: "10",
        skip: currentSkip.toString(),
      });
      if (activeTab !== "all" && activeTab !== "shorts") {
        params.set("category", activeTab);
      }

      const res = await fetch(`/api/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        let newPosts = data.posts || [];
        
        // Filter media/shorts if shorts tab is selected
        if (activeTab === "shorts") {
          newPosts = newPosts.filter((p: any) => p.imageUrl || p.videoUrl || p.gifUrl);
        }

        if (newPosts.length < 10) {
          setHasMorePosts(false);
        } else {
          setHasMorePosts(true);
        }
        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
        setSkip(currentSkip + newPosts.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
    }
  }, [skip, loadingPosts, activeTab]);

  // Handle Tab / Region Change
  useEffect(() => {
    fetchTrendsData(region, activeTab);
    setSkip(0);
    setHasMorePosts(true);
    fetchPostsData(true);
  }, [region, activeTab]);

  // Infinite Scroll Trigger
  const lastPostElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingPosts) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMorePosts) {
          fetchPostsData(false);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loadingPosts, hasMorePosts, fetchPostsData]
  );

  const RightSidebar = (
    <>
      <SearchBar />
      <FollowSuggestions />
    </>
  );

  return (
    <AppLayout rightSidebar={RightSidebar}>
      {/* ── Search & Header Bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--color-bg-base)",
        borderBottom: "1px solid var(--color-border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}>
        {/* Top Bar with Search & Region */}
        <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <SearchBar />
          </div>

          {/* Region Picker Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowRegionPicker(!showRegionPicker)}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
                borderRadius: "999px", padding: "8px 14px",
                fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)",
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}
            >
              <MapPin size={14} style={{ color: "var(--color-primary)" }} />
              <span>{regionName}</span>
              <ChevronDown size={13} />
            </button>

            {showRegionPicker && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowRegionPicker(false)} />
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0,
                  background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
                  borderRadius: "16px", padding: "6px", zIndex: 50,
                  boxShadow: "0 14px 40px rgba(0,0,0,0.25)",
                  minWidth: "190px", maxHeight: "300px", overflowY: "auto",
                }}>
                  <button
                    onClick={() => { setRegion("WW"); setShowRegionPicker(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      width: "100%", padding: "9px 12px", background: region === "WW" ? "rgba(29,155,240,0.12)" : "none",
                      border: "none", borderRadius: "10px", cursor: "pointer",
                      color: region === "WW" ? "var(--color-primary)" : "var(--color-text-main)",
                      fontSize: "0.85rem", fontWeight: 600, textAlign: "left",
                    }}
                  >
                    <Globe size={15} /> Worldwide
                  </button>
                  {regions.filter(r => r.code !== "WW").map((r) => (
                    <button
                      key={r.code}
                      onClick={() => { setRegion(r.code); setShowRegionPicker(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        width: "100%", padding: "9px 12px",
                        background: region === r.code ? "rgba(29,155,240,0.12)" : "none",
                        border: "none", borderRadius: "10px", cursor: "pointer",
                        color: region === r.code ? "var(--color-primary)" : "var(--color-text-main)",
                        fontSize: "0.85rem", fontWeight: region === r.code ? 700 : 600,
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

        {/* Live Score Ticker Widget */}
        <div style={{
          padding: "6px 16px",
          background: "linear-gradient(90deg, rgba(239,68,68,0.1), rgba(249,115,22,0.1))",
          borderTop: "1px solid rgba(239,68,68,0.2)",
          borderBottom: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: "0.78rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "#ef4444", color: "white", padding: "1px 6px", borderRadius: "4px", fontWeight: 900, fontSize: "0.62rem" }}>
              {liveTicker.badge}
            </span>
            <span style={{ fontWeight: 800, color: "var(--color-text-main)" }}>{liveTicker.title}</span>
            <span style={{ color: "var(--color-text-muted)" }}>{liveTicker.score}</span>
          </div>
          <span style={{ color: "var(--color-primary)", fontWeight: 700, cursor: "pointer" }}>View Match</span>
        </div>

        {/* Categories Tab Navigation */}
        <div style={{
          display: "flex", gap: "4px", overflowX: "auto", padding: "6px 12px",
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}>
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px",
                  background: "none", border: "none",
                  borderBottom: isActive ? "3px solid var(--color-primary)" : "3px solid transparent",
                  color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "0.9rem", cursor: "pointer",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div>
        {/* 1. TOP NEWS HIGHLIGHT BANNER */}
        {loadingTrends ? (
          <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
          </div>
        ) : topics.length > 0 ? (
          <div style={{
            padding: "16px 18px",
            background: "linear-gradient(135deg, rgba(29, 155, 240, 0.08), rgba(120, 87, 255, 0.05))",
            borderBottom: "1px solid var(--color-border)"
          }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Flame size={14} /> Today&apos;s Highlights in {regionName}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {topics.slice(0, 3).map((topic) => (
                <div
                  key={topic.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Link
                    href={`/search?q=${encodeURIComponent(topic.searchQuery)}`}
                    style={{ textDecoration: "none", color: "inherit", flex: 1 }}
                  >
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--color-text-main)", lineHeight: 1.35, marginBottom: "4px" }}>
                      {topic.title}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>Trending now</span>
                      <span>·</span>
                      <span>{topic.category}</span>
                      <span>·</span>
                      <span>{fmt(topic.postCount)} posts</span>
                    </div>
                  </Link>

                  {/* AI Summary Button */}
                  <button
                    onClick={(e) => handleOpenAiSummary(topic.title, e)}
                    style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      background: "rgba(120, 87, 255, 0.15)",
                      border: "1px solid rgba(120, 87, 255, 0.3)",
                      color: "#7857ff", borderRadius: "99px",
                      padding: "6px 12px", fontSize: "0.75rem", fontWeight: 800,
                      cursor: "pointer", marginLeft: "12px", flexShrink: 0
                    }}
                  >
                    <Bot size={14} />
                    <span>AI Summary</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 2. TRENDING TOPICS LIST */}
        {!loadingTrends && topics.length > 3 && (
          <div style={{ borderBottom: "8px solid var(--color-bg-surface)" }}>
            {topics.slice(3).map((topic) => (
              <div
                key={topic.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 18px",
                  borderBottom: "1px solid var(--color-border)",
                }}
                className="hover-bg"
              >
                <Link
                  href={`/search?q=${encodeURIComponent(topic.searchQuery)}`}
                  style={{ textDecoration: "none", color: "inherit", flex: 1 }}
                >
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", fontWeight: 600, marginBottom: "2px" }}>
                    {topic.category} · Trending
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-text-main)" }}>
                    {topic.title}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {fmt(topic.postCount)} posts
                  </div>
                </Link>

                <button
                  onClick={(e) => handleOpenAiSummary(topic.title, e)}
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    background: "rgba(120, 87, 255, 0.1)",
                    border: "1px solid rgba(120, 87, 255, 0.2)",
                    color: "#7857ff", borderRadius: "99px",
                    padding: "4px 10px", fontSize: "0.72rem", fontWeight: 700,
                    cursor: "pointer", marginLeft: "12px"
                  }}
                >
                  <Bot size={13} />
                  <span>AI Summary</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. HASHTAGS ROW */}
        {!loadingTrends && hashtags.length > 0 && (
          <div style={{ padding: "14px 18px", borderBottom: "8px solid var(--color-bg-surface)" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--color-text-muted)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Hash size={14} style={{ color: "var(--color-primary)" }} />
              Trending Hashtags
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {hashtags.map((h) => (
                <Link
                  key={h.tag}
                  href={`/hashtag/${encodeURIComponent(h.tag)}`}
                  style={{
                    textDecoration: "none",
                    background: "rgba(29, 155, 240, 0.1)",
                    color: "var(--color-primary)",
                    fontWeight: 700, fontSize: "0.82rem",
                    padding: "6px 12px", borderRadius: "999px",
                    border: "1px solid rgba(29, 155, 240, 0.2)",
                  }}
                >
                  #{h.tag} · {fmt(h.count)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 4. WHO TO FOLLOW IN-FEED SUGGESTIONS */}
        <div style={{ borderBottom: "8px solid var(--color-bg-surface)" }}>
          <FollowSuggestions />
        </div>

        {/* 5. INFINITE SCROLL TRENDING POSTS */}
        <div>
          <div style={{ padding: "14px 18px 6px", fontSize: "0.95rem", fontWeight: 900, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} style={{ color: "var(--color-primary)" }} />
            Trending Posts Feed
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {posts.map((post, idx) => {
              if (idx === posts.length - 1) {
                return (
                  <div ref={lastPostElementRef} key={post.id}>
                    <PostCard post={post} currentUserId={currentUserId} />
                  </div>
                );
              }
              return <PostCard key={post.id} post={post} currentUserId={currentUserId} />;
            })}
          </div>

          {loadingPosts && (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-primary)" }} />
            </div>
          )}

          {!hasMorePosts && posts.length > 0 && (
            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              You&apos;ve reached the end of trending posts! 🎉
            </div>
          )}
        </div>
      </div>

      {/* AI SUMMARY POPUP MODAL */}
      {selectedAiTopic && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }} onClick={() => setSelectedAiTopic(null)}>
          <div
            style={{
              background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
              borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "480px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: "16px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7857ff", fontWeight: 900 }}>
                <Bot size={22} />
                <span>AI Topic Insights</span>
              </div>
              <button onClick={() => setSelectedAiTopic(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--color-text-main)", margin: "0 0 4px" }}>
                {selectedAiTopic}
              </h3>
              {aiSummaryData?.sentiment && (
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--color-primary)" }}>
                  Sentiment: {aiSummaryData.sentiment}
                </span>
              )}
            </div>

            {loadingAiSummary ? (
              <div style={{ padding: "30px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "#7857ff" }} />
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Generating AI summary...</span>
              </div>
            ) : aiSummaryData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {aiSummaryData.summary.map((point, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", fontSize: "0.9rem", color: "var(--color-text-main)", lineHeight: 1.4 }}>
                    <span style={{ color: "#7857ff", fontWeight: 800 }}>•</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Could not load AI summary.</p>
            )}

            <button
              onClick={() => setSelectedAiTopic(null)}
              style={{
                marginTop: "8px", padding: "10px", borderRadius: "99px",
                background: "var(--color-primary)", color: "white", fontWeight: 700,
                border: "none", cursor: "pointer", textAlign: "center"
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
