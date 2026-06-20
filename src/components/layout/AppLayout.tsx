"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Home, User, Search, LogOut, Bell, Mail, Bookmark, MoreHorizontal, EyeOff, Plus, MessageSquare, Shield, 
  Settings as SettingsIcon, List, Users, CheckCircle, TrendingUp, BarChart3, HelpCircle, Command, Palette, Edit3, Camera
} from "lucide-react";
import styles from "./AppLayout.module.css";
import { CreatePostModal } from "@/features/posts/components/CreatePostModal";
import { CreateStoryModal } from "@/features/stories/components/CreateStoryModal";

export function AppLayout({ children, rightSidebar, fullWidth = false }: { children: React.ReactNode, rightSidebar?: React.ReactNode, fullWidth?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ userId: string; name: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [latestUnreadMsgId, setLatestUnreadMsgId] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{ senderName: string; content: string; conversationId: string; id: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const profileRes = await fetch("/api/users/profile");
        if (profileRes.ok) {
          const data = await profileRes.json();
          setUser({ userId: data.user.id, name: data.user.name });
        }

        const notifyRes = await fetch("/api/notifications/unread-count");
        if (notifyRes.ok) {
          const data = await notifyRes.json();
          setUnreadCount(data.count);
        }

        // Ping to update lastSeen
        await fetch("/api/users/ping", { method: "POST" }).catch(() => {});
      } catch (e) {}
    }
    fetchData();

    // Poll for notifications every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchMessagesUnread() {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadMessagesCount(data.count);

          if (data.latestUnread) {
            const { id, senderName, content, conversationId } = data.latestUnread;
            
            // Show toast if:
            // 1. It is a new unread message ID we haven't toasted yet.
            // 2. The user is not currently in this active chat page.
            const isViewingThisChat = pathname === `/messages/${conversationId}`;
            
            setLatestUnreadMsgId(prevId => {
              if (prevId !== id && !isViewingThisChat) {
                // Trigger toast
                setActiveToast({ id, senderName, content, conversationId });
                // Hide after 4 seconds
                setTimeout(() => {
                  setActiveToast(current => current?.id === id ? null : current);
                }, 4000);
              }
              return id;
            });
          }
        }
      } catch (e) {
        console.error("Error fetching unread message count", e);
      }
    }

    fetchMessagesUnread();
    const interval = setInterval(fetchMessagesUnread, 4000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { href: "/feed", icon: <Home size={30} />, label: "Home", id: "home" },
    { href: "/search", icon: <Search size={30} />, label: "Explore", id: "explore" },
    { href: "/messages", icon: <MessageSquare size={30} />, label: "Messages", id: "messages" },
    { href: "/notifications", icon: <Bell size={30} />, label: "Notifications", id: "notifications" },
    { href: "/bookmarks", icon: <Bookmark size={30} />, label: "Bookmarks", id: "bookmarks", desktopOnly: true },
    { href: "/lists", icon: <List size={30} />, label: "Lists", id: "lists", desktopOnly: true },
    { href: "/communities", icon: <Users size={30} />, label: "Communities", id: "communities", desktopOnly: true },
    { href: "/premium", icon: <CheckCircle size={30} />, label: "Premium", id: "premium", desktopOnly: true },
    { href: "/hidden", icon: <EyeOff size={30} />, label: "Hidden", id: "hidden", desktopOnly: true },
    { href: "/analytics", icon: <BarChart3 size={30} />, label: "Analytics", id: "analytics", desktopOnly: true },
    { href: user?.userId ? `/profile/${user.userId}` : "/profile", icon: <User size={30} />, label: "Profile", id: "profile" },
  ];

  const moreItems = [
    { href: "/bookmarks", icon: <Bookmark size={24} />, label: "Bookmarks", mobileOnly: true },
    { href: "/hidden", icon: <EyeOff size={24} />, label: "Hidden Content", mobileOnly: true },
    { href: "/analytics", icon: <BarChart3 size={24} />, label: "Analytics" },
    { href: "/ads", icon: <TrendingUp size={24} />, label: "Ads Manager" },
    { href: "/settings", icon: <SettingsIcon size={24} />, label: "Settings" },
    { icon: <Palette size={24} />, label: "Display", onClick: () => alert("Theme switching coming soon!") },
    { icon: <Shield size={24} />, label: "Privacy & Safety", onClick: () => alert("Privacy settings coming soon!") },
    { href: "/help", icon: <HelpCircle size={24} />, label: "Help Center" },
    { icon: <Command size={24} />, label: "Keyboard Shortcuts", onClick: () => alert("Shortcuts: N (New Post), L (Like)") },
    { icon: <LogOut size={24} />, label: "Logout", onClick: handleLogout, color: "#ff4d4d" },
  ];

  return (
    <div className={styles.layoutContainer}>
      <aside className={styles.leftSidebar}>
        <div className={styles.logoContainer}>
          <div 
            onClick={() => {
              if (pathname === "/feed") {
                router.refresh();
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                router.push("/feed");
              }
            }}
            style={{ textDecoration: "none", cursor: "pointer" }}
          >
            <h1 className="text-h2" style={{ color: "var(--color-primary)", letterSpacing: "-1px" }}>DOST</h1>
          </div>
        </div>

        <nav className={styles.navMenu}>
          {navItems.map(item => (
            <Link 
              key={item.id} 
              href={item.href} 
              className={`${styles.navItem} ${item.desktopOnly ? styles.desktopOnly : ""} ${pathname === item.href ? styles.navItemActive : ""}`}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                {item.icon}
                {item.id === "notifications" && unreadCount > 0 && (
                  <div style={{
                    position: "absolute", top: "-5px", right: "-5px",
                    background: "var(--color-primary)", color: "white",
                    borderRadius: "50%", width: "18px", height: "18px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 800, border: "2px solid var(--color-bg-base)"
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
                {item.id === "messages" && unreadMessagesCount > 0 && (
                  <div style={{
                    position: "absolute", top: "-5px", right: "-5px",
                    background: "var(--color-primary)", color: "white",
                    borderRadius: "50%", width: "18px", height: "18px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 800, border: "2px solid var(--color-bg-base)"
                  }}>
                    {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                  </div>
                )}
              </div>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}

          <div className={styles.navItem} onClick={() => setShowMore(!showMore)} style={{ cursor: "pointer", position: "relative" }}>
            <MoreHorizontal size={30} />
            <span className={styles.navLabel}>More</span>
            
            {showMore && (
              <>
                <div 
                  style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} 
                  onClick={(e) => { e.stopPropagation(); setShowMore(false); }}
                />
                <div className={`${styles.moreMenu} glass animate-scale-in`}>
                  {moreItems.map((item, idx) => {
                    // Mobile only items should only show on mobile (width < 650)
                    // But since we are using CSS for responsiveness, we can add a className
                    const itemClass = item.mobileOnly ? styles.mobileOnly : "";
                    
                    return item.href ? (
                      <Link key={idx} href={item.href} className={`${styles.moreMenuItem} ${itemClass}`} onClick={() => setShowMore(false)}>
                        {item.icon} <span>{item.label}</span>
                      </Link>
                    ) : (
                      <button key={idx} className={`${styles.moreMenuItem} ${itemClass}`} style={{ color: item.color }} onClick={() => { item.onClick && item.onClick(); setShowMore(false); }}>
                        {item.icon} <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </nav>

        <button onClick={handleLogout} className={`${styles.navItem} ${styles.logoutBtn} ${styles.desktopOnly}`}>
          <LogOut size={30} />
          <span className={styles.navLabel}>Logout</span>
        </button>
      </aside>

      <main className={styles.mainContent} style={fullWidth ? { flex: 1, minWidth: 0, width: "auto", borderRight: "none", overflow: "hidden" } : {}}>
        {children}
      </main>

      {!fullWidth && (
        <aside className={styles.rightSidebar}>
          {rightSidebar}
        </aside>
      )}

      {/* Global Click Handler to close FAB menu */}
      {showFabMenu && (pathname === "/feed" || pathname === "/profile" || pathname.startsWith("/profile/")) && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
          onClick={() => setShowFabMenu(false)}
        />
      )}

      {(pathname === "/feed" || pathname === "/profile" || pathname.startsWith("/profile/")) && (
        <div style={{ position: "fixed", bottom: "80px", right: "20px", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "16px" }} className={styles.fabContainer || ""}>
          {showFabMenu && (
            <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "8px" }}>
              <button onClick={() => { setShowStoryModal(true); setShowFabMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", padding: "12px 16px", borderRadius: "99px", color: "var(--color-text-main)", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <span>Add Story</span>
                <div style={{ background: "var(--color-primary)", color: "white", padding: "8px", borderRadius: "50%", display: "flex" }}><Camera size={18} /></div>
              </button>
              <button onClick={() => { setShowCreateModal(true); setShowFabMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", padding: "12px 16px", borderRadius: "99px", color: "var(--color-text-main)", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <span>New Post</span>
                <div style={{ background: "var(--color-primary)", color: "white", padding: "8px", borderRadius: "50%", display: "flex" }}><Edit3 size={18} /></div>
              </button>
            </div>
          )}
          <button className={styles.fab} onClick={() => setShowFabMenu(!showFabMenu)} style={{ position: "relative", bottom: "auto", right: "auto" }}>
            <Plus size={32} style={{ transform: showFabMenu ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.2s" }} />
          </button>
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal 
          onClose={() => setShowCreateModal(false)} 
          userName={user?.name || "User"} 
        />
      )}

      {showStoryModal && (
        <CreateStoryModal 
          onClose={() => setShowStoryModal(false)} 
          onSuccess={() => setShowStoryModal(false)}
        />
      )}

      {/* Floating Toast Notification for messages */}
      {activeToast && (
        <div 
          onClick={() => {
            router.push(`/messages/${activeToast.conversationId}`);
            setActiveToast(null);
          }}
          className="glass animate-slide-up"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
            zIndex: 9999,
            cursor: "pointer",
            width: "320px",
            maxWidth: "calc(100vw - 48px)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.85rem", letterSpacing: "0.5px" }}>NEW MESSAGE</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              style={{
                background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.8rem", padding: 0
              }}
            >
              ✕
            </button>
          </div>
          <span style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "1.05rem" }}>
            {activeToast.senderName}
          </span>
          <p style={{
            margin: 0,
            fontSize: "0.95rem",
            color: "var(--color-text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {activeToast.content}
          </p>
        </div>
      )}
    </div>
  );
}
