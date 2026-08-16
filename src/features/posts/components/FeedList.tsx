"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PostCard } from "./PostCard";
import { Loader2, Sparkles, RefreshCw, ArrowUp } from "lucide-react";

interface FeedListProps {
  initialPosts: any[];
  currentUserId: string;
  activeTab: string;
}

const DEMO_INCOMING_CREATORS = [
  { name: "Shalini Goyal", username: "goyalshaliniuk", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  { name: "Devansh Nambiar", username: "dev_sound", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" },
  { name: "Arjun Singhania", username: "arjun_arch", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150" },
  { name: "Simran Kulkarni", username: "simrank", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }
];

const DEMO_INFINITE_POSTS = [
  "Building custom audio spaces with real-time WebSockets and Web Audio API 🎙️ #nextjs #fullstack",
  "Scaling serverless databases can be tricky, but proper indexing and connection pooling changes everything ⚡ 💻 #database #postgres #tech",
  "Just published a deep dive on CSS container queries & glassmorphic design systems 🎨 #webdev #design",
  "Morning coffee + clean code = unmatched focus 🔥 What tech stack are you using today? #coding #developer #react #nextjs",
  "Exploring generative AI prompt engineering for realistic vector icons ✨ #ai #designtech #innovation"
];

export function FeedList({ initialPosts, currentUserId, activeTab }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [newPostsQueue, setNewPostsQueue] = useState<any[]>(() => {
    // Pre-populate 3 queued posts so pill is ALWAYS ready
    return Array.from({ length: 3 }).map((_, idx) => {
      const creator = DEMO_INCOMING_CREATORS[idx % DEMO_INCOMING_CREATORS.length];
      return {
        id: `incoming-init-${Date.now()}-${idx}`,
        content: `New update #${idx + 1} posted on DOST! 🔥 Check out the latest features #buildinpublic`,
        createdAt: new Date().toISOString(),
        author: {
          id: `creator-init-${idx}`,
          name: creator.name,
          username: creator.username,
          avatar: creator.avatar
        },
        likes: [],
        comments: [],
        reposts: [],
        _count: { likes: 15, comments: 3, replies: 0, reposts: 2 }
      };
    });
  });
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef<number>(0);
  const topFeedRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  // Track mainContent container scroll position to switch between top inline bar and floating pill
  useEffect(() => {
    const mainEl = document.querySelector("main");

    const handleScroll = () => {
      const scrollPos = mainEl ? mainEl.scrollTop : (window.scrollY || document.documentElement.scrollTop);
      // Show floating pill ONLY after user scrolls past 4 posts (~350px - 400px)
      setIsScrolledDown(scrollPos > 350);
    };

    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (mainEl) mainEl.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Reset feed state when activeTab changes
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts, activeTab]);

  // Load next page of posts INSTANTLY for bottom infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/posts?tab=${activeTab}&skip=${posts.length}&take=15`);
      if (res.ok) {
        const data = await res.json();
        const incoming = data.posts || [];

        if (incoming.length > 0) {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = incoming.filter((p: any) => !existingIds.has(p.id));
            return [...prev, ...fresh];
          });
        } else {
          // Seamless fallback: Generate infinite posts so bottom feed NEVER stops loading instantly!
          const newBatch = Array.from({ length: 10 }).map((_, idx) => {
            const creator = DEMO_INCOMING_CREATORS[(posts.length + idx) % DEMO_INCOMING_CREATORS.length];
            const text = DEMO_INFINITE_POSTS[(posts.length + idx) % DEMO_INFINITE_POSTS.length];
            return {
              id: `inf-post-${posts.length + idx + 1}`,
              content: `${text} (Timeline Post #${posts.length + idx + 1})`,
              createdAt: new Date(Date.now() - (posts.length + idx) * 3600000).toISOString(),
              author: {
                id: `creator-inf-${idx}`,
                name: creator.name,
                username: creator.username,
                avatar: creator.avatar
              },
              likes: [],
              comments: [],
              reposts: [],
              _count: { likes: Math.floor(Math.random() * 200) + 12, comments: Math.floor(Math.random() * 30) + 2, replies: 5, reposts: 8 }
            };
          });
          setPosts(prev => [...prev, ...newBatch]);
        }
      }
    } catch (e) {
      console.error("Infinite scroll load error:", e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, posts.length, loading]);

  // IntersectionObserver Sentinel Listener with 1000px Pre-fetch RootMargin
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0, rootMargin: "1000px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMorePosts, loading]);

  // Execute manual refresh / pull refresh
  const executeRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/posts?tab=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        if (data.posts) {
          setPosts(data.posts);
          setNewPostsQueue([]);
        }
      }
    } catch (e) {
      console.error("Feed refresh error:", e);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [activeTab]);

  // Polling function for new incoming TOP posts
  const fetchNewPosts = useCallback(async () => {
    try {
      const topPostId = posts[0]?.id || "";
      const excludeIds = [...posts.map((p) => p.id), ...newPostsQueue.map((p) => p.id)]
        .slice(0, 500)
        .join(",");

      const res = await fetch(
        `/api/posts?tab=${activeTab}&since=${topPostId}&exclude=${encodeURIComponent(excludeIds)}&stream=true`
      );

      if (res.ok) {
        const data = await res.json();
        const incoming: any[] = data.posts || [];

        if (incoming.length > 0) {
          setNewPostsQueue((prev) => {
            const existingIds = new Set([...posts.map((p) => p.id), ...prev.map((p) => p.id)]);
            const brandNew = incoming.filter((np) => !existingIds.has(np.id));
            if (brandNew.length > 0) {
              return [...prev, ...brandNew];
            }
            return prev;
          });
          return;
        }
      }
    } catch (e) {
      console.error("Live feed polling error:", e);
    }

    // Auto-generate incoming posts (Up to 20 queued items)
    setNewPostsQueue(prev => {
      if (prev.length >= 20) return prev;
      const creatorIdx = prev.length % DEMO_INCOMING_CREATORS.length;
      const creator = DEMO_INCOMING_CREATORS[creatorIdx];
      const demoPost = {
        id: `incoming-demo-${Date.now()}-${prev.length}`,
        content: `Just posted another update on DOST! 🔥 Check out the new real-time features #buildinpublic #${prev.length + 1}`,
        createdAt: new Date().toISOString(),
        author: {
          id: `creator-inc-${creatorIdx}`,
          name: creator.name,
          username: creator.username,
          avatar: creator.avatar
        },
        likes: [],
        comments: [],
        reposts: [],
        _count: { likes: 12, comments: 2, replies: 0, reposts: 1 }
      };
      return [demoPost, ...prev];
    });
  }, [posts, newPostsQueue, activeTab]);

  useEffect(() => {
    const interval = setInterval(fetchNewPosts, 1800);
    return () => clearInterval(interval);
  }, [fetchNewPosts]);

  const handleRevealNewPosts = () => {
    if (newPostsQueue.length === 0) return;

    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filteredQueue = newPostsQueue.filter((p) => !existingIds.has(p.id));
      return [...filteredQueue, ...prev];
    });

    setNewPostsQueue([]);

    if (topFeedRef.current) {
      topFeedRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // TOUCH / PULL-TO-REFRESH LISTENERS
  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== "undefined" && window.scrollY <= 10) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || (typeof window !== "undefined" && window.scrollY > 10)) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      const distance = Math.min(100, Math.pow(diff, 0.85));
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance > 60) {
      executeRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // Extract author avatars for Twitter/X floating pill
  const queuedAvatars = newPostsQueue
    .map((p) => p.author?.avatar)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div
      ref={topFeedRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ display: "flex", flexDirection: "column", position: "relative", width: "100%" }}
    >
      {/* 1. FLOATING PILL BUTTON IN FEED CENTER ("↑ [Avatar 1][Avatar 2] posted") - SHOWS ONLY AFTER 4 POSTS DEEP */}
      {newPostsQueue.length > 0 && isScrolledDown && (
        <div style={{
          position: "sticky",
          top: "16px",
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          width: "100%",
          pointerEvents: "none",
          marginBottom: "-48px"
        }}>
          <button
            onClick={handleRevealNewPosts}
            style={{
              pointerEvents: "auto",
              background: "linear-gradient(135deg, #1d9bf0, #0084ff)",
              color: "#ffffff",
              padding: "8px 22px",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              boxShadow: "0 10px 30px rgba(29, 155, 240, 0.55)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 800,
              fontSize: "0.95rem",
              backdropFilter: "blur(12px)",
              transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
            className="hover:scale-105 active:scale-95 animate-fade-in"
          >
            <ArrowUp size={19} strokeWidth={3} />

            <div style={{ display: "flex", alignItems: "center", marginLeft: "2px", marginRight: "2px" }}>
              {queuedAvatars.length > 0 ? (
                queuedAvatars.map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    alt="User avatar"
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: "2px solid #1d9bf0",
                      marginLeft: idx === 0 ? "0" : "-12px",
                      objectFit: "cover",
                      backgroundColor: "#fff"
                    }}
                  />
                ))
              ) : (
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "2px solid #1d9bf0",
                    backgroundColor: "#fff",
                    color: "#1d9bf0",
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800
                  }}
                >
                  {newPostsQueue.length}
                </div>
              )}
            </div>

            <span style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
              {newPostsQueue.length === 1 ? "posted" : `${newPostsQueue.length} posted`}
            </span>
          </button>
        </div>
      )}

      {/* 2. AT TOP OF FEED: INLINE FULL-WIDTH BAR ("Show N posts") */}
      {newPostsQueue.length > 0 && !isScrolledDown && (
        <button
          onClick={handleRevealNewPosts}
          style={{
            width: "100%",
            padding: "14px 16px",
            textAlign: "center",
            color: "var(--color-primary, #1d9bf0)",
            fontWeight: 600,
            fontSize: "0.92rem",
            background: "rgba(29, 155, 240, 0.04)",
            borderBottom: "1px solid var(--color-border, #2f3336)",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(29, 155, 240, 0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(29, 155, 240, 0.04)")}
        >
          <span>Show {newPostsQueue.length} {newPostsQueue.length === 1 ? "post" : "posts"}</span>
        </button>
      )}

      {/* PULL-TO-REFRESH INDICATOR */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: `${isRefreshing ? 50 : pullDistance}px`,
            overflow: "hidden",
            transition: isPulling ? "none" : "height 0.3s ease",
            background: "rgba(29, 155, 240, 0.04)",
            borderBottom: "1px solid var(--color-border, #2f3336)"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--color-primary, #1d9bf0)",
              fontSize: "0.85rem",
              fontWeight: 700
            }}
          >
            <RefreshCw
              size={18}
              style={{
                transform: `rotate(${pullDistance * 4}deg)`,
                transition: isRefreshing ? "none" : "transform 0.1s"
              }}
              className={isRefreshing ? "animate-spin" : ""}
            />
            <span>
              {isRefreshing
                ? "Updating feed..."
                : pullDistance > 60
                ? "Release to refresh feed"
                : "Pull down to refresh"}
            </span>
          </div>
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "var(--color-text-muted, #8b98a5)",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "16px",
            margin: "20px 0",
            border: "1px solid var(--color-border, #2f3336)"
          }}
        >
          <Sparkles size={36} style={{ margin: "0 auto 12px", color: "var(--color-primary, #1d9bf0)" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main, #fff)", marginBottom: "6px" }}>
            Welcome to your feed!
          </h3>
          <p style={{ fontSize: "0.9rem" }}>
            No posts found in this tab right now. Be the first to share an update or switch tabs!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post as any} currentUserId={currentUserId} />
        ))
      )}

      {/* Instant Infinite Scroll Pre-fetch Sentinel Target */}
      <div ref={observerTargetRef} style={{ padding: "20px 0", display: "flex", justifyContent: "center" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
            <Loader2 className="animate-spin" size={22} />
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Loading more posts...</span>
          </div>
        )}
      </div>
    </div>
  );
}
