import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/features/posts/components/PostCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBar } from "@/features/search/components/SearchBar";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";
import { ProfileHeader } from "@/features/users/components/ProfileHeader";
import { TrendingSection } from "@/features/search/components/TrendingSection";
import { PageHeader } from "@/components/common/PageHeader";

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

  // Check if current user still exists in DB (to prevent stale session errors after re-seed)
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
    include: {
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
          author: { select: { id: true, name: true, avatar: true } }
        }
      }
    },
  });

  const RightSidebar = (
    <>
      <SearchBar />
      <TrendingSection />
      <FollowSuggestions />
    </>
  );

  const isOwnProfile = currentUser.userId === profileUserId;

  return (
    <AppLayout rightSidebar={RightSidebar}>
      <PageHeader title={dbUser.name || "Profile"} subtitle={`${dbUser._count.posts} posts`} showBackButton />
      <ProfileHeader 
        user={dbUser as any} 
        isOwnProfile={isOwnProfile} 
        initialIsFollowing={isFollowing} 
      />

      <h2 className="text-h3" style={{ marginBottom: "var(--space-4)", paddingLeft: "var(--space-2)" }}>
        {isOwnProfile ? "Your Posts" : "Posts"}
      </h2>
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        {isBlockedByMe ? (
          <div className="glass" style={{ padding: "var(--space-8)", borderRadius: "var(--radius-lg)", textAlign: "center", border: "1px solid #ff4d4d" }}>
            <p style={{ color: "#ff4d4d", fontWeight: 700, fontSize: "1.2rem" }}>You have blocked this user.</p>
            <p className="text-muted">Unblock them to see their posts.</p>
          </div>
        ) : hasBlockedMe ? (
          <div className="glass" style={{ padding: "var(--space-8)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <p className="text-muted">This user has restricted access to their profile.</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass" style={{ padding: "var(--space-6)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <p className="text-muted">No posts found.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post as any} currentUserId={currentUser.userId as string} />
          ))
        )}
      </div>
    </AppLayout>
  );
}
