"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onFollowToggle?: (isFollowing: boolean) => void;
}

export function FollowButton({ userId, initialIsFollowing, onFollowToggle }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFollow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // The API returns { following: boolean }
        const newStatus = data.following;
        setIsFollowing(newStatus);
        if (onFollowToggle) onFollowToggle(newStatus);
        router.refresh();
      }
    } catch (e) {
      console.error("Follow error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      style={{
        padding: "8px 20px",
        borderRadius: "var(--radius-full)",
        border: isFollowing ? "1px solid var(--color-border)" : "none",
        background: isFollowing ? "transparent" : "var(--color-primary)",
        color: isFollowing ? "var(--color-text-main)" : "white",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all var(--transition-fast)",
        minWidth: "120px",
        justifyContent: "center",
      }}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus size={18} />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus size={18} />
          Follow
        </>
      )}
    </button>
  );
}
