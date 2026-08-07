import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/features/posts/components/PostCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBar } from "@/features/search/components/SearchBar";
import { TrendingSection } from "@/features/search/components/TrendingSection";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";
import { UserPlus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { SearchUserRow } from "@/features/search/components/SearchUserRow";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
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

  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  let users: any[] = [];
  let posts: any[] = [];

  if (query) {
    users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        stories: {
          where: {
            expiresAt: { gt: new Date() },
            privacy: "PUBLIC"
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      take: 10,
    });

    posts = await prisma.post.findMany({
      where: {
        content: { contains: query },
      },
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
      take: 20,
      orderBy: { createdAt: "desc" },
    });
  }

  const RightSidebar = (
    <>
      <SearchBar />
      <TrendingSection />
      <FollowSuggestions />
    </>
  );

  return (
    <AppLayout rightSidebar={RightSidebar}>
      <PageHeader title={query ? `Search results for "${query}"` : "Search"} showBackButton />
      <div style={{ padding: "var(--space-4)" }}>
      {!query ? (
        <div className="glass" style={{ padding: "var(--space-6)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
          <p className="text-muted">Type something in the search bar to find people and posts.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Users Section */}
          {users.length > 0 && (
            <div>
              <h2 className="text-h3" style={{ marginBottom: "var(--space-4)" }}>People</h2>
              <div className="glass" style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {users.map(u => (
                  <SearchUserRow key={u.id} user={u} />
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          <div>
            <h2 className="text-h3" style={{ marginBottom: "var(--space-4)" }}>Posts</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {posts.length === 0 ? (
                <div className="glass" style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }}>
                  <p className="text-muted">No posts found matching your query.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post as any} currentUserId={user.userId as string} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}
