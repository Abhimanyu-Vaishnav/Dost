import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/features/posts/components/PostCard";
import { CreatePost } from "@/features/posts/components/CreatePost";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBar } from "@/features/search/components/SearchBar";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";

import { TrendingSection } from "@/features/search/components/TrendingSection";
import { PageHeader } from "@/components/common/PageHeader";
import { StoryFeed } from "@/features/stories/components/StoryFeed";

import { FeedTabs } from "@/features/posts/components/FeedTabs";
import { FeedList } from "@/features/posts/components/FeedList";
export default async function FeedPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "for-you";

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect("/login");
  }

  // Check if current user still exists in DB
  const currentDbUser = await prisma.user.findUnique({
    where: { id: user.userId as string }
  });

  if (!currentDbUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId as string },
    select: { name: true, avatar: true }
  });

  // Filter logic
  let where: any = {
    hiddenBy: { none: { userId: user.userId as string } },
    author: {
      mutedBy: { none: { userId: user.userId as string } },
      blockedBy: { none: { userId: user.userId as string } },
    }
  };

  if (activeTab === "following") {
    const following = await prisma.follows.findMany({
      where: { followerId: user.userId as string },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    where = { ...where, authorId: { in: followingIds } };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      likes: true,
      bookmarkedBy: {
        where: { userId: user.userId as string }
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
    take: 50,
  });

  const RightSidebar = (
    <>
      <SearchBar />
      <TrendingSection />
      <FollowSuggestions />
    </>
  );

  return (
    <AppLayout rightSidebar={RightSidebar}>
      <PageHeader title="Home" />
      <StoryFeed currentUserId={user.userId as string} currentUserAvatar={dbUser?.avatar || null} />
      <FeedTabs />
      <CreatePost 
        userName={dbUser?.name || "User"} 
        userAvatar={dbUser?.avatar || null} 
      />
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        <FeedList 
          initialPosts={posts as any} 
          currentUserId={user.userId as string} 
          activeTab={activeTab}
        />
      </div>
    </AppLayout>
  );
}
