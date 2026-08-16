import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/features/posts/components/PostCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";

export default async function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/login");
  const user = await verifyToken(token);
  if (!user) redirect("/login");

  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const isHashtag = !decodedTag.startsWith("#");

  // Search posts that contain this hashtag (case-insensitive)
  const posts = await prisma.post.findMany({
    where: {
      content: {
        contains: isHashtag ? `#${decodedTag}` : decodedTag,
        mode: "insensitive",
      },
    },
    include: {
      author: { select: { id: true, name: true, avatar: true, username: true } },
      parent: {
        include: {
          author: { select: { id: true, name: true, avatar: true, username: true } }
        }
      },
      likes: true,
      bookmarkedBy: { where: { userId: user.userId as string } },
      comments: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          likes: true,
        },
        orderBy: { createdAt: "asc" },
      },
      repost: {
        include: { author: { select: { id: true, name: true, avatar: true } } },
      },
    },
    orderBy: [
      { likes: { _count: "desc" } },
      { createdAt: "desc" },
    ],
  });

  const displayName = isHashtag ? `#${decodedTag}` : decodedTag;

  return (
    <AppLayout>
      <PageHeader title={displayName} showBackButton />

      {/* Stats Banner */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--color-border)",
        background: "linear-gradient(135deg, rgba(29,155,240,0.08), rgba(120,87,255,0.06))",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--color-text-main)", lineHeight: 1 }}>
            {posts.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600, marginTop: "2px" }}>
            {posts.length === 1 ? "Post" : "Posts"}
          </div>
        </div>
        <div style={{ width: "1px", height: "32px", background: "var(--color-border)" }} />
        <div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-main)" }}>
            {displayName}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
            {posts.length > 0 ? "Trending on DOST" : "No posts yet"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {posts.length === 0 ? (
          <div style={{
            padding: "64px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(29,155,240,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}>
              🔍
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-text-main)", margin: "0 0 6px" }}>
                No posts found
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>
                Be the first to post with {displayName}
              </p>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post as any} currentUserId={user.userId as string} />
          ))
        )}
      </div>
    </AppLayout>
  );
}
