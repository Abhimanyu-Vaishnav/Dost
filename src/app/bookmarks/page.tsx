import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/features/posts/components/PostCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBar } from "@/features/search/components/SearchBar";
import { TrendingSection } from "@/features/search/components/TrendingSection";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";

import { PageHeader } from "@/components/common/PageHeader";

export default async function BookmarksPage() {
// ... auth ...
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect("/login");
  }

  const bookmarkedPosts = await prisma.post.findMany({
    where: {
      bookmarkedBy: {
        some: {
          userId: user.userId as string
        }
      }
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
      <PageHeader title="Bookmarks" subtitle="Saved posts" showBackButton />
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        {bookmarkedPosts.length === 0 ? (
          <div className="glass" style={{ padding: "var(--space-6)", borderRadius: "var(--radius-lg)", textAlign: "center", margin: "20px" }}>
            <p className="text-muted">You haven't bookmarked any posts yet.</p>
          </div>
        ) : (
          bookmarkedPosts.map((post) => (
            <PostCard key={post.id} post={post as any} currentUserId={user.userId as string} />
          ))
        )}
      </div>
    </AppLayout>
  );
}
