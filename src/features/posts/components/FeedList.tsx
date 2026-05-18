"use client";

import { useEffect, useState, useCallback } from "react";
import { PostCard } from "./PostCard";
import { Loader2, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface FeedListProps {
  initialPosts: any[];
  currentUserId: string;
  activeTab: string;
}

export function FeedList({ initialPosts, currentUserId, activeTab }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [newPosts, setNewPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Reset state when tab changes
  useEffect(() => {
    setPosts(initialPosts);
    setNewPosts([]);
  }, [initialPosts]);

  const fetchNewPosts = useCallback(async () => {
    try {
      const lastPostId = posts[0]?.id;
      const res = await fetch(`/api/posts?tab=${activeTab}&since=${lastPostId || ""}`);
      if (res.ok) {
        const data = await res.json();
        const incoming = data.posts || [];
        
        // Filter out posts we already have
        const actuallyNew = incoming.filter((np: any) => !posts.some(p => p.id === np.id));
        
        if (actuallyNew.length > 0) {
          setNewPosts(prev => {
            const combined = [...actuallyNew, ...prev];
            // Remove duplicates
            return Array.from(new Set(combined.map(p => p.id))).map(id => combined.find(p => p.id === id));
          });
        }
      }
    } catch (e) {
      console.error("Poll error:", e);
    }
  }, [posts, activeTab]);

  // Polling effect every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNewPosts, 30000);
    return () => clearInterval(interval);
  }, [fetchNewPosts]);

  const showNewPosts = () => {
    setPosts(prev => [...newPosts, ...prev]);
    setNewPosts([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
      {/* New Posts Banner */}
      {newPosts.length > 0 && (
        <button 
          onClick={showNewPosts}
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            backgroundColor: "var(--color-primary)",
            color: "white",
            padding: "10px 20px",
            borderRadius: "var(--radius-full)",
            border: "none",
            boxShadow: "var(--shadow-lg)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 700,
            fontSize: "0.9rem"
          }}
          className="animate-bounce"
        >
          <ArrowUp size={16} /> Show {newPosts.length} new posts
        </button>
      )}

      {posts.length === 0 ? (
        <div className="glass" style={{ padding: "var(--space-6)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
          <p className="text-muted">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post as any} currentUserId={currentUserId} />
        ))
      )}

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <Loader2 className="animate-spin" />
        </div>
      )}
    </div>
  );
}
