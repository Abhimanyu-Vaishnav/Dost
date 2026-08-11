"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PostCard } from "./PostCard";
import { Loader2, ArrowUp, Sparkles, RefreshCw } from "lucide-react";

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
  const topFeedRef = useRef<HTMLDivElement>(null);

  // Reset feed state when activeTab or initialPosts change
  useEffect(() => {
    setPosts(initialPosts);
    setNewPostsQueue([]);
  }, [initialPosts, activeTab]);

  // Polling function for brand-new posts
  const fetchNewPosts = useCallback(async () => {
    try {
      const topPostId = posts[0]?.id || "";
      const res = await fetch(`/api/posts?tab=${activeTab}&since=${topPostId}`);
      if (res.ok) {
        const data = await res.json();
        const incoming: any[] = data.posts || [];

        if (incoming.length > 0) {
          setNewPostsQueue((prev) => {
            const existingIds = new Set([...posts.map((p) => p.id), ...prev.map((p) => p.id)]);
            const brandNew = incoming.filter((np) => !existingIds.has(np.id));
            if (brandNew.length > 0) {
              return [...brandNew, ...prev];
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error("Live feed polling error:", e);
    }
  }, [posts, activeTab]);

  // Fast live polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchNewPosts, 10000);
    return () => clearInterval(interval);
  }, [fetchNewPosts]);

  // Function to reveal and prepend queued new posts (Twitter/X style)
  const handleRevealNewPosts = () => {
    if (newPostsQueue.length === 0) return;

    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filteredQueue = newPostsQueue.filter((p) => !existingIds.has(p.id));
      return [...filteredQueue, ...prev];
    });

    setNewPostsQueue([]);

    // Smooth scroll to top of feed
    if (topFeedRef.current) {
      topFeedRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Pull / manual refresh handler
  const handleManualRefresh = async () => {
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
      console.error("Manual refresh error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get up to 3 author avatars for stacked avatar preview on the pill button
  const avatarStack = Array.from(
    new Set(newPostsQueue.map((p) => p.author?.avatar).filter(Boolean))
  ).slice(0, 3);

  return (
    <div ref={topFeedRef} style={{ display: "flex", flexDirection: "column", position: "relative", width: "100%" }}>
      {/* Twitter/X Style Floating "Show N Posts" Banner */}
      {newPostsQueue.length > 0 && (
        <div
          style={{
            position: "sticky",
            top: "64px",
            zIndex: 40,
            display: "flex",
            justifyContent: "center",
            width: "100%",
            padding: "8px 0",
            pointerEvents: "none"
          }}
        >
          <button
            onClick={handleRevealNewPosts}
            style={{
              pointerEvents: "auto",
              backgroundColor: "var(--color-primary, #1d9bf0)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "9999px",
              padding: "10px 20px",
              boxShadow: "0 8px 24px rgba(29, 155, 240, 0.45)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s",
              backdropFilter: "blur(8px)"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {/* Stacked Avatar Previews */}
            {avatarStack.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", marginRight: "2px" }}>
                {avatarStack.map((url, i) => (
                  <img
                    key={i}
                    src={url as string}
                    alt="avatar"
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      border: "2px solid var(--color-primary, #1d9bf0)",
                      marginLeft: i > 0 ? "-8px" : "0px",
                      objectFit: "cover"
                    }}
                  />
                ))}
              </div>
            )}

            <ArrowUp size={16} style={{ strokeWidth: 3 }} />
            <span>Show {newPostsQueue.length} {newPostsQueue.length === 1 ? "post" : "posts"}</span>
          </button>
        </div>
      )}

      {/* Manual Refresh Bar if feed has posts */}
      {posts.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "8px 16px",
            borderBottom: "1px solid var(--color-border, #2f3336)"
          }}
        >
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary, #1d9bf0)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh Feed"}
          </button>
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

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
          <Loader2 className="animate-spin" style={{ color: "var(--color-primary, #1d9bf0)" }} size={24} />
        </div>
      )}
    </div>
  );
}
