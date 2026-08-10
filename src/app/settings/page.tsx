import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsClient } from "@/features/settings/components/SettingsClient";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);
  if (!payload?.userId) {
    redirect("/login");
  }

  const userId = payload.userId as string;

  // Fetch User Profile
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      avatar: true,
      accountType: true,
      accountSubType: true,
      closeFriendIds: true
    }
  });

  if (!profile) {
    redirect("/login");
  }

  // Fetch Muted Users
  const mutedUsers = await prisma.mute.findMany({
    where: { userId },
    include: {
      mutedUser: {
        select: { id: true, name: true, username: true, avatar: true }
      }
    }
  });

  // Fetch Blocked Users
  const blockedUsers = await prisma.block.findMany({
    where: { userId },
    include: {
      blockedUser: {
        select: { id: true, name: true, username: true, avatar: true }
      }
    }
  });

  return (
    <AppLayout fullWidth>
      <SettingsClient
        initialProfile={profile}
        initialMutedUsers={mutedUsers}
        initialBlockedUsers={blockedUsers}
        initialCloseFriends={[]}
      />
    </AppLayout>
  );
}
