import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/features/posts/components/PostCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBar } from "@/features/search/components/SearchBar";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";
import { TrendingSection } from "@/features/search/components/TrendingSection";
import { PageHeader } from "@/components/common/PageHeader";
import { PrivacySettings } from "@/features/users/components/PrivacySettings";

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect("/login");
  }

  const userId = user.userId as string;

  const [hiddenPosts, mutedUsers, blockedUsers] = await Promise.all([
    prisma.post.findMany({
      where: { hiddenBy: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        likes: true,
        bookmarkedBy: { where: { userId } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } }, likes: true },
          orderBy: { createdAt: "asc" }
        },
        repost: { include: { author: { select: { id: true, name: true, avatar: true } } } }
      },
    }),
    prisma.mute.findMany({
      where: { userId },
      include: { mutedUser: { select: { id: true, name: true, avatar: true } } }
    }),
    prisma.block.findMany({
      where: { userId },
      include: { blockedUser: { select: { id: true, name: true, avatar: true } } }
    })
  ]);

  const RightSidebar = (
    <>
      <SearchBar />
      <TrendingSection />
      <FollowSuggestions />
    </>
  );

  return (
    <AppLayout rightSidebar={RightSidebar}>
      <PageHeader title="Privacy & Content" subtitle="Manage your mutes, blocks and hidden posts" showBackButton />
      
      <PrivacySettings 
        mutedUsers={mutedUsers}
        blockedUsers={blockedUsers}
        hiddenPosts={hiddenPosts}
        currentUserId={userId}
      />

      {/* Hidden Posts List below tabs if active tab is hidden */}
      <div style={{ display: "flex", flexDirection: "column", padding: "12px" }}>
        {hiddenPosts.map((post) => (
          <PostCard key={post.id} post={post as any} currentUserId={userId} isPrivacyPage={true} />
        ))}
      </div>
    </AppLayout>
  );
}
