import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBar } from "@/features/search/components/SearchBar";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";
import { TrendingSection } from "@/features/search/components/TrendingSection";
import { ProfileClientView } from "@/features/users/components/ProfileClientView";

export default async function UniversalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const currentUser = await verifyToken(token);

  if (!currentUser) {
    redirect("/login");
  }

  const currentDbUser = await prisma.user.findUnique({
    where: { id: currentUser.userId as string }
  });

  if (!currentDbUser) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const profileUserId = resolvedParams.id;

  const dbUser = await prisma.user.findUnique({
    where: { id: profileUserId },
    include: {
      _count: {
        select: { followers: true, following: true, posts: true },
      },
      followers: {
        where: { followerId: currentUser.userId as string },
      },
      blockedBy: {
        where: { userId: currentUser.userId as string },
      },
      blockedUsers: {
        where: { blockedUserId: currentUser.userId as string },
      }
    },
  });

  if (!dbUser) {
    return (
      <AppLayout>
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <h2>User not found</h2>
        </div>
      </AppLayout>
    );
  }

  const isBlockedByMe = dbUser.blockedBy.length > 0;
  const hasBlockedMe = dbUser.blockedUsers.length > 0;
  const isFollowing = dbUser.followers.length > 0;
  const isOwnProfile = currentUser.userId === profileUserId;

  const postInclude = {
    author: {
      select: { id: true, name: true, avatar: true, username: true },
    },
    parent: {
      include: {
        author: { select: { id: true, name: true, avatar: true, username: true } }
      }
    },
    likes: true,
    bookmarkedBy: {
      where: { userId: currentUser.userId as string }
    },
    comments: {
      include: { 
        user: { select: { id: true, name: true, avatar: true } },
        likes: true
      },
      orderBy: { createdAt: "asc" }
    },
    repost: {
      include: {
        author: { select: { id: true, name: true, avatar: true, username: true } }
      }
    }
  };

  // Fetch Original Posts
  const posts = (isBlockedByMe || hasBlockedMe) ? [] : await prisma.post.findMany({
    where: { 
      authorId: profileUserId,
      hiddenBy: { none: { userId: currentUser.userId as string } },
      OR: [
        { threadId: null, parentId: null },
        { isThreadStart: true }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: postInclude as any,
    take: 40
  });

  // Fetch Replies / Comments by User
  const replies = (isBlockedByMe || hasBlockedMe) ? [] : await prisma.post.findMany({
    where: {
      authorId: profileUserId,
      parentId: { not: null }
    },
    orderBy: { createdAt: "desc" },
    include: postInclude as any,
    take: 30
  });

  // Fetch Reposts & Quote Posts by User
  const repostPosts = (isBlockedByMe || hasBlockedMe) ? [] : await prisma.post.findMany({
    where: {
      authorId: profileUserId,
      OR: [
        { repostId: { not: null } },
        { quotePostId: { not: null } }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: postInclude as any,
    take: 30
  });

  // Fetch Media Posts (Image / Video)
  const mediaPosts = (isBlockedByMe || hasBlockedMe) ? [] : await prisma.post.findMany({
    where: {
      authorId: profileUserId,
      OR: [
        { imageUrl: { not: null } },
        { videoUrl: { not: null } }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: postInclude as any,
    take: 30
  });

  // Fetch Liked Posts by User
  const likedRecords = (isBlockedByMe || hasBlockedMe) ? [] : await prisma.like.findMany({
    where: { userId: profileUserId },
    include: {
      post: {
        include: postInclude as any
      }
    },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  const likedPosts = likedRecords.map(r => r.post).filter(Boolean);

  const RightSidebar = (
    <>
      <SearchBar />
      <TrendingSection />
      <FollowSuggestions />
    </>
  );

  return (
    <AppLayout rightSidebar={RightSidebar}>
      <ProfileClientView
        dbUser={dbUser}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        posts={posts}
        replies={replies}
        repostPosts={repostPosts}
        mediaPosts={mediaPosts}
        likedPosts={likedPosts}
        currentUserId={currentUser.userId as string}
        isBlockedByMe={isBlockedByMe}
        hasBlockedMe={hasBlockedMe}
      />
    </AppLayout>
  );
}
