import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/features/posts/components/PostCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBar } from "@/features/search/components/SearchBar";
import { TrendingSection } from "@/features/search/components/TrendingSection";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";
import { Flame, UserPlus, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchUserRow } from "@/features/search/components/SearchUserRow";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; tab?: string }> }) {
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
  const activeTab = resolvedParams.tab || "trending";

  if (!query) {
    redirect("/trending");
  }

  let users: any[] = [];
  let posts: any[] = [];

  if (query) {
    users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
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
        content: { contains: query, mode: "insensitive" },
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
      <PageHeader title={query ? `Search results for "${query}"` : "Explore"} showBackButton />
      
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Search Bar Input Container */}
        <div style={{ width: "100%" }}>
          <SearchBar />
        </div>

        {!query ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Explore Sub-Tabs (Trending & News vs Who to Follow) */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid var(--color-border)",
              marginBottom: "8px"
            }}>
              <Link
                href="/search?tab=trending"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px 0",
                  textDecoration: "none",
                  fontWeight: activeTab === "trending" ? 800 : 600,
                  fontSize: "0.95rem",
                  color: activeTab === "trending" ? "var(--color-primary)" : "var(--color-text-muted)",
                  borderBottom: activeTab === "trending" ? "3px solid var(--color-primary)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <Flame size={18} style={{ color: activeTab === "trending" ? "var(--color-primary)" : "inherit" }} />
                <span>Trending & News</span>
              </Link>
              <Link
                href="/search?tab=people"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px 0",
                  textDecoration: "none",
                  fontWeight: activeTab === "people" ? 800 : 600,
                  fontSize: "0.95rem",
                  color: activeTab === "people" ? "var(--color-primary)" : "var(--color-text-muted)",
                  borderBottom: activeTab === "people" ? "3px solid var(--color-primary)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <UserPlus size={18} style={{ color: activeTab === "people" ? "var(--color-primary)" : "inherit" }} />
                <span>Who to Follow</span>
              </Link>
            </div>

            {/* Tab Contents */}
            {activeTab === "people" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <FollowSuggestions />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <TrendingSection />
                <FollowSuggestions />
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {/* Users Section */}
            {users.length > 0 && (
              <div>
                <h2 className="text-h3" style={{ marginBottom: "var(--space-4)", fontSize: "1.1rem", fontWeight: 800 }}>People</h2>
                <div className="glass" style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  {users.map(u => (
                    <SearchUserRow key={u.id} user={u} />
                  ))}
                </div>
              </div>
            )}

            {/* Posts Section */}
            <div>
              <h2 className="text-h3" style={{ marginBottom: "var(--space-4)", fontSize: "1.1rem", fontWeight: 800 }}>Posts</h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {posts.length === 0 ? (
                  <div className="glass" style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }}>
                    <p className="text-muted" style={{ margin: 0, color: "var(--color-text-muted)" }}>No posts found matching your query.</p>
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
