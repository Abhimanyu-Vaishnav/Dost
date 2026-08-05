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

  const posts = await prisma.post.findMany({
    where: {
      content: { contains: `#${decodedTag}` },
    },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
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
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppLayout>
      <PageHeader title={`#${decodedTag}`} showBackButton />
      <div style={{ padding: "var(--space-4)" }}>
        <p className="text-muted" style={{ marginBottom: "16px" }}>
          {posts.length} {posts.length === 1 ? "post" : "posts"} with #{decodedTag}
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {posts.length === 0 ? (
            <div className="glass" style={{ padding: "var(--space-6)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
              <p className="text-muted">No posts found with #{decodedTag}</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post as any} currentUserId={user.userId as string} />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
