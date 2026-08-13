"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PostCard } from "./PostCard";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";

interface FeedListProps {
  initialPosts: any[];
  currentUserId: string;
  activeTab: string;
}

export function FeedList({ initialPosts, currentUserId, activeTab }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [newPostsQueue, setNewPostsQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef<number>(0);
  const topFeedRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  // Reset feed state when activeTab or initialPosts change
  useEffect(() => {
    setPosts(initialPosts);
    setNewPostsQueue([]);
    setHasMore(true);
  }, [initialPosts, activeTab]);

  // Load next page of posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (loading || !hasMore) return;
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
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error("Infinite scroll load error:", e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, posts.length, loading, hasMore]);

  // IntersectionObserver Sentinel Listener for Infinite Scroll
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMorePosts, loading, hasMore]);

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
          setHasMore(true);
        }
      }
    } catch (e) {
      console.error("Feed refresh error:", e);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [activeTab]);

  // Polling function for new posts to queue in the Twitter/X "Show N posts" bar
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
              return [...prev, ...brandNew.slice(0, 5)];
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error("Live feed polling error:", e);
    }
  }, [posts, newPostsQueue, activeTab]);

  useEffect(() => {
    const interval = setInterval(fetchNewPosts, 15000);
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

  return (
    <div
      ref={topFeedRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ display: "flex", flexDirection: "column", position: "relative", width: "100%" }}
    >
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

      {/* SHOW N POSTS BAR */}
      {newPostsQueue.length > 0 && (
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
        >
          <span>Show {newPostsQueue.length} {newPostsQueue.length === 1 ? "post" : "posts"}</span>
        </button>
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

      {/* Infinite Scroll Sentinel Target & Loader */}
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
