import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/features/search/components/SearchBar";
import { FollowSuggestions } from "@/features/users/components/FollowSuggestions";
import { TrendingSection } from "@/features/search/components/TrendingSection";
import Link from "next/link";
import { Heart, MessageCircle, UserPlus, Repeat2, PenTool, ShieldAlert } from "lucide-react";

import { NotificationClient } from "@/features/notifications/components/NotificationClient";

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

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE": return <Heart size={20} fill="#f91880" color="#f91880" />;
      case "COMMENT": return <MessageCircle size={20} color="var(--color-primary)" />;
      case "FOLLOW": return <UserPlus size={20} color="var(--color-primary)" />;
      case "REPOST": return <Repeat2 size={20} color="#00ba7c" />;
      case "QUOTE": return <PenTool size={20} color="var(--color-primary)" />;
      case "COMMENT_LIKE": return <Heart size={18} fill="#f91880" color="#f91880" />;
      case "SYSTEM": return <ShieldAlert size={20} color="var(--color-primary)" />;
      default: return null;
    }
  };

  const getMessage = (notification: any) => {
    const actorName = notification.actor?.name || "Security";
    switch (notification.type) {
      case "LIKE": return <span><b>{actorName}</b> liked your post</span>;
      case "COMMENT": return <span><b>{actorName}</b> commented on your post</span>;
      case "FOLLOW": return <span><b>{actorName}</b> followed you</span>;
      case "REPOST": return <span><b>{actorName}</b> reposted your post</span>;
      case "QUOTE": return <span><b>{actorName}</b> quoted your post</span>;
      case "COMMENT_LIKE": return <span><b>{actorName}</b> liked your comment</span>;
      case "SYSTEM": return <span><b>Security Alert:</b> New login detected on your account</span>;
      default: return "";
    }
  };

  return (
    <AppLayout rightSidebar={RightSidebar}>
      <NotificationClient />
      <PageHeader title="Notifications" showBackButton />
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
            <h3 className="text-h3">No notifications yet</h3>
            <p className="text-muted">When people interact with you, you'll see it here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} style={{ 
              padding: "20px 16px", 
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              gap: "12px",
              backgroundColor: n.isRead ? "transparent" : "rgba(29, 155, 240, 0.05)",
              transition: "background 0.2s"
            }} className="hover-bg-subtle">
              <div style={{ marginTop: "4px", width: "40px", display: "flex", justifyContent: "flex-end" }}>
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href={`/profile/${n.actor.id}`} style={{ width: "fit-content" }}>
                    <div style={{ 
                      width: "40px", height: "40px", borderRadius: "50%", 
                      backgroundColor: "var(--color-primary)", color: "white",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700,
                      overflow: "hidden"
                    }}>
                      {n.actor.avatar ? (
                        <img src={n.actor.avatar} alt={n.actor.name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (n.actor.name?.charAt(0).toUpperCase() || "?")}
                    </div>
                  </Link>
                  <div style={{ fontSize: "1.1rem", color: "var(--color-text-main)" }}>
                    {getMessage(n)}
                  </div>
                </div>
                {n.post && (
                  <Link href={`/feed`} style={{ textDecoration: "none" }}>
                    <div style={{ 
                      marginTop: "8px", padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)",
                      background: "rgba(0,0,0,0.02)"
                    }}>
                      <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: 1.4 }}>
                        {n.post.content.length > 100 ? n.post.content.substring(0, 100) + "..." : n.post.content}
                      </p>
                    </div>
                  </Link>
                )}
                <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
