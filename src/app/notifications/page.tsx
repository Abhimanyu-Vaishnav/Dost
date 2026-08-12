import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/features/search/components/SearchBar";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";
import { TrendingSection } from "@/features/search/components/TrendingSection";
import { NotificationClient } from "@/features/notifications/components/NotificationClient";
import { NotificationList } from "@/features/notifications/components/NotificationList";

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await verifyToken(token);
  if (!user) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.userId as string },
    include: {
      actor: { select: { id: true, name: true, avatar: true } },
      post: { select: { id: true, content: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 50
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
      <NotificationClient />
      <PageHeader title="Notifications" showBackButton />
      
      <NotificationList notifications={notifications} />
    </AppLayout>
  );
}
