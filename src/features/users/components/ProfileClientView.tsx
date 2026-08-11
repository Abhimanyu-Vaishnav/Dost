"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileTabs } from "./ProfileTabs";

interface ProfileClientViewProps {
  dbUser: any;
  isOwnProfile: boolean;
  isFollowing: boolean;
  posts: any[];
  replies: any[];
  repostPosts: any[];
  mediaPosts: any[];
  likedPosts: any[];
  currentUserId: string;
  isBlockedByMe: boolean;
  hasBlockedMe: boolean;
}

export function ProfileClientView({
  dbUser,
  isOwnProfile,
  isFollowing,
  posts,
  replies,
  repostPosts,
  mediaPosts,
  likedPosts,
  currentUserId,
  isBlockedByMe,
  hasBlockedMe
}: ProfileClientViewProps) {
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const username = dbUser.username || dbUser.name?.toLowerCase().replace(/\s+/g, '') || "user";

  return (
    <>
      <PageHeader 
        title={dbUser.name || "Profile"} 
        subtitle={`${dbUser._count?.posts || 0} posts`} 
        showBackButton 
        searchPlaceholder={`Search @${username}'s posts...`}
        searchQuery={headerSearchQuery}
        onSearchChange={setHeaderSearchQuery}
      />
      <ProfileHeader 
        user={dbUser} 
        isOwnProfile={isOwnProfile} 
        initialIsFollowing={isFollowing} 
      />

      <ProfileTabs
        posts={posts}
        replies={replies}
        repostPosts={repostPosts}
        mediaPosts={mediaPosts}
        likedPosts={likedPosts}
        currentUserId={currentUserId}
        isOwnProfile={isOwnProfile}
        isBlockedByMe={isBlockedByMe}
        hasBlockedMe={hasBlockedMe}
        username={username}
        externalSearchQuery={headerSearchQuery}
      />
    </>
  );
}
