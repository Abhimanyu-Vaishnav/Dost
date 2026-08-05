import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { CommunitiesList } from "@/features/communities/components/CommunitiesList";

export default async function CommunitiesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/login");
  const user = await verifyToken(token);
  if (!user) redirect("/login");

  const communities = await prisma.community.findMany({
    include: {
      creator: { select: { name: true, avatar: true } },
      _count: { select: { members: true, posts: true } },
      members: { where: { userId: user.userId as string } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppLayout>
      <PageHeader title="Communities" showBackButton />
      <div style={{ padding: "var(--space-4)" }}>
        <CommunitiesList initialCommunities={communities as any} currentUserId={user.userId as string} />
      </div>
    </AppLayout>
  );
}
