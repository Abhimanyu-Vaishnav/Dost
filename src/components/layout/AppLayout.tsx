"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  Home, User, Search, LogOut, Bell, Mail, Bookmark, MoreHorizontal, EyeOff, Plus, MessageSquare, Shield, ShieldAlert,
  Settings as SettingsIcon, List, Users, CheckCircle2, TrendingUp, BarChart3, HelpCircle, Command, Palette, Edit3, Camera, Sparkles, Flame, UserPlus, Video, Phone, X
} from "lucide-react";
import styles from "./AppLayout.module.css";
import { CreatePostModal } from "@/features/posts/components/CreatePostModal";
import { CreateStoryModal } from "@/features/stories/components/CreateStoryModal";
import { ThemeModal } from "@/components/layout/ThemeModal";
import { useTheme } from "@/context/ThemeContext";

let GLOBAL_USER_CACHE: any = null;
let GLOBAL_UNREAD_NOTIF_CACHE: number = 0;
let GLOBAL_UNREAD_MSG_CACHE: number = 0;

export function AppLayout({ children, rightSidebar, fullWidth = false }: { children: React.ReactNode, rightSidebar?: React.ReactNode, fullWidth?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setFontFromDob } = useTheme();
  const [user, setUser] = useState<{ 
    userId: string; 
    name: string; 
    username?: string | null; 
    avatar?: string | null; 
    isVerified?: boolean;
    followersCount?: number;
    followingCount?: number;
  } | null>(() => GLOBAL_USER_CACHE);
  const [unreadCount, setUnreadCount] = useState(() => GLOBAL_UNREAD_NOTIF_CACHE);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(() => GLOBAL_UNREAD_MSG_CACHE);
  const [latestUnreadMsgId, setLatestUnreadMsgId] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{ senderName: string; content: string; conversationId: string; id: string } | null>(null);
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loginToastStr = sessionStorage.getItem("dost_login_toast");
      if (loginToastStr) {
        sessionStorage.removeItem("dost_login_toast");
        try {
          const parsed = JSON.parse(loginToastStr);
          setSecurityToast(parsed.message || "Security Alert: Login successful");
          setTimeout(() => {
            setSecurityToast(null);
          }, 5000);
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const profileRes = await fetch("/api/users/profile");
        if (profileRes.ok) {
          const data = await profileRes.json();
          const userData = { 
            userId: data.user.id, 
            name: data.user.name, 
            username: data.user.username,
            avatar: data.user.avatar,
            isVerified: data.user.isVerified || data.user.accountType === "PREMIUM" || data.user.accountType === "VERIFIED" || false,
            followersCount: data.user._count?.followers || 0,
            followingCount: data.user._count?.following || 0,
          };
          setUser(userData);
          GLOBAL_USER_CACHE = userData;

          if (data.user.dob && !localStorage.getItem("dost_font_size")) {
            setFontFromDob(data.user.dob);
          }
        }

        const notifyRes = await fetch("/api/notifications/unread-count");
        if (notifyRes.ok) {
          const data = await notifyRes.json();
          setUnreadCount(data.count);
          GLOBAL_UNREAD_NOTIF_CACHE = data.count;
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

  const lastNotifiedMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    async function fetchMessagesUnread() {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadMessagesCount(data.count);
          GLOBAL_UNREAD_MSG_CACHE = data.count;

          if (data.latestUnread) {
            const { id, senderName, content, conversationId } = data.latestUnread;
            const isViewingThisChat = pathname === `/messages/${conversationId}`;
            
            if (lastNotifiedMsgIdRef.current !== id) {
              lastNotifiedMsgIdRef.current = id;
              if (!isViewingThisChat) {
                setActiveToast({ id, senderName, content, conversationId });
                setTimeout(() => {
                  setActiveToast(current => current?.id === id ? null : current);
                }, 4000);
              }
            }
          }
        }
      } catch (e) {
        console.error("Error fetching unread message count", e);
      }
    }

    fetchMessagesUnread();
    const interval = setInterval(fetchMessagesUnread, 1500);
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

  const userHandle = `@${user?.username || (user?.name ? user.name.toLowerCase().replace(/\s+/g, "") : "user")}`;

  const isItemActive = (href: string) => {
    if (href === "/feed" && (pathname === "/feed" || pathname === "/")) return true;
    if (href !== "/feed" && pathname?.startsWith(href)) return true;
    return false;
  };

  const renderNavIcon = (id: string, isActive: boolean) => {
    const size = 21;
    switch (id) {
      case "home":
        return <Home size={size} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />;
      case "explore":
        return <Search size={size} strokeWidth={isActive ? 3 : 2} />;
      case "shorts":
        return <Video size={size} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />;
      case "messages":
        return <MessageSquare size={size} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />;
      case "notifications":
        return <Bell size={size} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />;
      case "bookmarks":
        return <Bookmark size={size} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />;
      case "lists":
        return <List size={size} strokeWidth={isActive ? 3 : 2} />;
      case "communities":
        return <Users size={size} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />;
      case "premium":
        return <CheckCircle2 size={size} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />;
      case "analytics":
        return <BarChart3 size={size} strokeWidth={isActive ? 3 : 2} />;
      case "calls":
        return <Phone size={size} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />;
      case "profile":
        return <User size={size} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />;
      default:
        return <Home size={size} />;
    }
  };

  // Nav items list for Desktop
  const desktopNavItems = [
    { href: "/feed", label: "Home", id: "home" },
    { href: "/search", label: "Explore", id: "explore" },
    { href: "/shorts", label: "Shorts", id: "shorts" },
    { href: "/calls", label: "Calls", id: "calls" },
    { href: "/communities", label: "Communities", id: "communities" },
    { href: "/notifications", label: "Notifications", id: "notifications" },
    { href: "/messages", label: "Messages", id: "messages" },
    { href: "/bookmarks", label: "Bookmarks", id: "bookmarks" },
    { href: "/lists", label: "Lists", id: "lists" },
    { href: "/premium", label: "Premium", id: "premium" },
    { href: "/analytics", label: "Analytics", id: "analytics" },
    { href: user?.username ? `/profile/${user.username}` : user?.userId ? `/profile/${user.userId}` : "/profile", label: "Profile", id: "profile" },
  ];

  // Exactly 6 Mobile Bottom Bar Navigation Items (Spanning Start to End)
  const mobileBottomItems = [
    { href: "/feed", label: "Home", id: "home" },
    { href: "/search", label: "Explore", id: "explore" },
    { href: "/shorts", label: "Shorts", id: "shorts" },
    { href: "/notifications", label: "Notifications", id: "notifications" },
    { href: "/messages", label: "Messages", id: "messages" },
    { href: "/bookmarks", label: "Bookmarks", id: "bookmarks" },
  ];

  const moreItems = [
    { href: "/bookmarks", icon: <Bookmark size={20} />, label: "Bookmarks" },
    { href: "/hidden", icon: <EyeOff size={20} />, label: "Hidden Content" },
    { href: "/analytics", icon: <BarChart3 size={20} />, label: "Analytics" },
    { href: "/ads", icon: <TrendingUp size={20} />, label: "Ads Manager" },
    { href: "/settings", icon: <SettingsIcon size={20} />, label: "Settings" },
    { icon: <Palette size={20} />, label: "Display & Font", onClick: () => setShowThemeModal(true) },
    { icon: <Shield size={20} />, label: "Privacy & Safety", onClick: () => alert("Privacy settings coming soon!") },
    { href: "/help", icon: <HelpCircle size={20} />, label: "Help Center" },
    { icon: <LogOut size={20} />, label: "Logout", onClick: handleLogout, color: "#ff4d4d" },
  ];

  const isMessagesPage = pathname?.startsWith("/messages");

  return (
    <div className={`${styles.layoutContainer} ${isMessagesPage ? styles.layoutContainerFull : ""}`}>
      {/* Mobile Top Navigation Header */}
      <header className={styles.mobileHeader}>
        <div 
          style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
          onClick={() => setShowSideDrawer(true)}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border)" }} />
          ) : (
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem", border: "1px solid var(--color-border)" }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </div>

        <div 
          style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
          onClick={() => {
            if (pathname === "/feed") {
              router.refresh();
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              router.push("/feed");
            }
          }}
        >
          <div style={{
            width: "28px", height: "28px", borderRadius: "8px",
            background: "linear-gradient(135deg, var(--color-primary), #00c6ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 900, fontSize: "1rem"
          }}>
            D
          </div>
          <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--color-primary)", letterSpacing: "-0.5px" }}>
            DOST
          </span>
        </div>

        <button 
          onClick={() => setShowThemeModal(true)} 
          style={{ background: "none", border: "none", color: "var(--color-text-main)", cursor: "pointer", padding: "4px" }}
        >
          <Palette size={22} />
        </button>
      </header>

      {/* Mobile Left Side Drawer Panel (Matching Image 3 Sample Layout) */}
      {showSideDrawer && (
        <>
          <div 
            className={styles.drawerBackdrop} 
            onClick={() => setShowSideDrawer(false)}
          />
          <aside className={styles.sideDrawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerAvatarRow}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className={styles.drawerAvatar} />
                ) : (
                  <div className={styles.drawerAvatar} style={{ background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.3rem" }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <button 
                  onClick={() => setShowSideDrawer(false)}
                  style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
                >
                  <X size={22} />
                </button>
              </div>

              <div className={styles.drawerUserInfo}>
                <div className={styles.drawerNameRow}>
                  <span className={styles.drawerName}>{user?.name || "User"}</span>
                  {user?.isVerified && (
                    <CheckCircle2 size={16} style={{ color: "var(--color-primary)", fill: "var(--color-primary)", stroke: "var(--color-bg-base)" }} />
                  )}
                </div>
                <span className={styles.drawerHandle}>{userHandle}</span>
              </div>

              <div className={styles.drawerStatsRow}>
                <div className={styles.drawerStatItem}>
                  <span className={styles.drawerStatNum}>{user?.followingCount ?? 0}</span>
                  <span className={styles.drawerStatLabel}>Following</span>
                </div>
                <div className={styles.drawerStatItem}>
                  <span className={styles.drawerStatNum}>{user?.followersCount ?? 0}</span>
                  <span className={styles.drawerStatLabel}>Followers</span>
                </div>
              </div>
            </div>

            {/* Mobile Drawer Options List (Our App Data) */}
            <div className={styles.drawerMenuList}>
              <Link href={user?.userId ? `/profile/${user.userId}` : "/profile"} className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <User size={22} /> <span>Profile</span>
              </Link>
              <Link href="/trending" className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <Flame size={22} style={{ color: "#ff6b00" }} /> <span>Trending &amp; News</span>
              </Link>
              <Link href="/search?tab=people" className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <UserPlus size={22} style={{ color: "var(--color-primary)" }} /> <span>Who to Follow</span>
              </Link>
              <Link href="/premium" className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <CheckCircle2 size={22} /> <span>Premium</span>
              </Link>
              <Link href="/bookmarks" className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <Bookmark size={22} /> <span>Bookmarks</span>
              </Link>
              <Link href="/lists" className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <List size={22} /> <span>Lists</span>
              </Link>
              <Link href="/communities" className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <Users size={22} /> <span>Communities</span>
              </Link>
              <Link href="/analytics" className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <BarChart3 size={22} /> <span>Analytics</span>
              </Link>
              <button className={styles.drawerMenuItem} onClick={() => { setShowThemeModal(true); setShowSideDrawer(false); }}>
                <Palette size={22} /> <span>Display & Font</span>
              </button>
              <Link href="/settings" className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <SettingsIcon size={22} /> <span>Settings and privacy</span>
              </Link>
              <Link href="/help" className={styles.drawerMenuItem} onClick={() => setShowSideDrawer(false)}>
                <HelpCircle size={22} /> <span>Help Center</span>
              </Link>
              <button className={styles.drawerMenuItem} style={{ color: "#ff4d4d", marginTop: "8px" }} onClick={() => { handleLogout(); setShowSideDrawer(false); }}>
                <LogOut size={22} /> <span>Log out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Sidebar for Desktop & 5-Icon Bottom Bar for Mobile */}
      <aside className={styles.leftSidebar}>
        <div className={styles.topSection}>
          <div className={styles.logoContainer}>
            <div 
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
              onClick={() => {
                if (pathname === "/feed" || pathname === "/") {
                  const mainEl = document.querySelector("main");
                  const currentScroll = mainEl ? mainEl.scrollTop : window.scrollY;
                  if (currentScroll > 100) {
                    if (mainEl) {
                      mainEl.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  } else {
                    router.refresh();
                  }
                } else {
                  router.push("/feed");
                }
              }}
            >
              <div style={{
                width: "34px", height: "34px", borderRadius: "10px",
                background: "linear-gradient(135deg, var(--color-primary), #00c6ff)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 900, fontSize: "1.2rem", boxShadow: "0 4px 12px rgba(29, 155, 240, 0.4)"
              }}>
                D
              </div>
              <h1 className={styles.logoText} style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--color-primary)", letterSpacing: "-0.5px", margin: 0 }}>
                DOST
              </h1>
            </div>
          </div>

          {/* Nav menu rendered desktop or mobile 5-item bar */}
          <nav className={styles.navMenu}>
            {/* Desktop items render full list; on mobile screen width, mobileBottomItems render 5 icons */}
            {desktopNavItems.map(item => {
              const active = isItemActive(item.href);
              const isMobileBottomItem = mobileBottomItems.some(m => m.id === item.id);
              return (
                <Link 
                  key={item.id} 
                  href={item.href} 
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                  onClick={(e) => {
                    if (item.id === "home" && (pathname === "/feed" || pathname === "/")) {
                      e.preventDefault();
                      const mainEl = document.querySelector("main");
                      const currentScroll = mainEl ? mainEl.scrollTop : (window.scrollY || document.documentElement.scrollTop);
                      
                      if (currentScroll > 50) {
                        if (mainEl) {
                          mainEl.scrollTo({ top: 0, behavior: "smooth" });
                        }
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        window.dispatchEvent(new CustomEvent("dost:refresh-feed"));
                      }
                    }
                  }}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    {renderNavIcon(item.id, active)}
                    {item.id === "notifications" && unreadCount > 0 && (
                      <div style={{
                        position: "absolute", top: "-5px", right: "-5px",
                        background: "var(--color-primary)", color: "white",
                        borderRadius: "50%", width: "16px", height: "16px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", fontWeight: 800, border: "2px solid var(--color-bg-base)"
                      }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </div>
                    )}
                    {item.id === "messages" && unreadMessagesCount > 0 && (
                      <div style={{
                        position: "absolute", top: "-5px", right: "-5px",
                        background: "var(--color-primary)", color: "white",
                        borderRadius: "50%", width: "16px", height: "16px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", fontWeight: 800, border: "2px solid var(--color-bg-base)"
                      }}>
                        {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                      </div>
                    )}
                  </div>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              );
            })}

            {/* Desktop More Menu Button */}
            <div className={styles.navItem} onClick={() => setShowMore(!showMore)} style={{ cursor: "pointer", position: "relative" }}>
              <MoreHorizontal size={24} />
              <span className={styles.navLabel}>More</span>
              
              {showMore && (
                <>
                  <div 
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} 
                    onClick={(e) => { e.stopPropagation(); setShowMore(false); }}
                  />
                  <div className={`${styles.moreMenu} animate-scale-in`} style={{ zIndex: 9999 }}>
                    {moreItems.map((item, idx) => (
                      item.href ? (
                        <Link key={idx} href={item.href} className={styles.moreMenuItem} onClick={() => setShowMore(false)}>
                          {item.icon} <span>{item.label}</span>
                        </Link>
                      ) : (
                        <button key={idx} className={styles.moreMenuItem} style={{ color: item.color }} onClick={() => { item.onClick && item.onClick(); setShowMore(false); }}>
                          {item.icon} <span>{item.label}</span>
                        </button>
                      )
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>

          <button onClick={() => setShowCreateModal(true)} className={styles.postBtnFull}>
            Post
          </button>
        </div>

        {/* Bottom Left Profile Pill */}
        {user && (
          <div 
            className={styles.profilePill}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className={styles.profileInfo}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className={styles.profileAvatar} />
              ) : (
                <div className={styles.profileAvatar} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--color-primary)" }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.profileText}>
                <div className={styles.profileNameRow}>
                  <span className={styles.profileName}>{user.name}</span>
                  {user.isVerified && (
                    <CheckCircle2 size={14} style={{ color: "var(--color-primary)", fill: "var(--color-primary)", stroke: "var(--color-bg-base)" }} />
                  )}
                </div>
                <span className={styles.profileHandle}>{userHandle}</span>
              </div>
            </div>
            <MoreHorizontal size={18} className={styles.moreDotsIcon} style={{ color: "var(--color-text-muted)" }} />

            {showProfileMenu && (
              <>
                <div 
                  style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} 
                  onClick={(e) => { e.stopPropagation(); setShowProfileMenu(false); }}
                />
                <div className={`${styles.moreMenu} animate-scale-in`} style={{ bottom: "60px", left: "0", zIndex: 9999 }}>
                  <Link href={user?.username ? `/profile/${user.username}` : user?.userId ? `/profile/${user.userId}` : "/profile"} className={styles.moreMenuItem} onClick={() => setShowProfileMenu(false)}>
                    <User size={18} /> <span>View Profile</span>
                  </Link>
                  <button className={styles.moreMenuItem} onClick={() => { setShowThemeModal(true); setShowProfileMenu(false); }}>
                    <Palette size={18} /> <span>Display & Font</span>
                  </button>
                  <button className={styles.moreMenuItem} style={{ color: "#ff4d4d" }} onClick={() => { handleLogout(); setShowProfileMenu(false); }}>
                    <LogOut size={18} /> <span>Log out {userHandle}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </aside>

      <main 
        className={styles.mainContent} 
        style={
          pathname === "/shorts"
            ? { flex: 1, minWidth: 0, width: "auto", borderRight: "none", overflow: "hidden", padding: 0 } 
            : pathname?.startsWith("/messages")
            ? { flex: 1, minWidth: 0, width: "100%", borderRight: "none", overflow: "visible", padding: 0 }
            : fullWidth 
            ? { flex: 1, minWidth: 0, width: "auto", borderRight: "none", overflowY: "auto" } 
            : {}
        }
      >
        {children}
      </main>

      {!fullWidth && rightSidebar && (
        <aside className={styles.rightSidebar}>
          {rightSidebar}
        </aside>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (Instagram / YouTube Style) */}
      <nav className={styles.mobileBottomBar}>
        {[
          { href: "/feed", label: "Home", icon: <Home size={20} />, id: "home" },
          { href: "/search", label: "Explore", icon: <Search size={20} />, id: "explore" },
          { href: "/shorts", label: "Shorts", icon: <Video size={20} />, id: "shorts" },
          { href: "/calls", label: "Calls", icon: <Phone size={20} />, id: "calls" },
          { href: "/notifications", label: "Alerts", icon: <Bell size={20} />, id: "notifications" },
          { href: "/messages", label: "Messages", icon: <Mail size={20} />, id: "messages" },
        ].map((tab) => {
          const active = isItemActive(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${styles.mobileBottomTab} ${active ? styles.mobileBottomTabActive : ""}`}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                {tab.icon}
                {tab.id === "notifications" && unreadCount > 0 && (
                  <div style={{
                    position: "absolute", top: "-4px", right: "-6px",
                    background: "var(--color-primary)", color: "white",
                    borderRadius: "50%", width: "14px", height: "14px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.6rem", fontWeight: 800
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
                {tab.id === "messages" && unreadMessagesCount > 0 && (
                  <div style={{
                    position: "absolute", top: "-4px", right: "-6px",
                    background: "var(--color-primary)", color: "white",
                    borderRadius: "50%", width: "14px", height: "14px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.6rem", fontWeight: 800
                  }}>
                    {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                  </div>
                )}
              </div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

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
          userAvatar={user?.avatar}
        />
      )}

      {showStoryModal && (
        <CreateStoryModal 
          onClose={() => setShowStoryModal(false)} 
          onSuccess={() => setShowStoryModal(false)}
        />
      )}

      {showThemeModal && (
        <ThemeModal 
          onClose={() => setShowThemeModal(false)} 
        />
      )}

      {/* Floating Toast Notification for messages */}
      {activeToast && (
        <div 
          onClick={() => {
            router.push(`/messages/${activeToast.conversationId}`);
            setActiveToast(null);
          }}
          className="glass animate-slide-up responsive-msg-toast"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-primary)",
            borderRadius: "20px",
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            boxShadow: "0 14px 40px rgba(0, 0, 0, 0.4)",
            cursor: "pointer",
            width: "320px",
            maxWidth: "calc(100vw - 32px)"
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

      {/* Floating Toast Notification for Login Security Alert */}
      {securityToast && (
        <div 
          className="glass animate-slide-up"
          style={{
            position: "fixed",
            bottom: activeToast ? "100px" : "24px",
            right: "24px",
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-primary)",
            borderRadius: "20px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            zIndex: 9999,
            maxWidth: "calc(100vw - 48px)"
          }}
        >
          <ShieldAlert size={24} color="var(--color-primary)" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.85rem", letterSpacing: "0.5px" }}>SECURITY ALERT</span>
            <span style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.95rem" }}>{securityToast}</span>
          </div>
          <button 
            onClick={() => setSecurityToast(null)}
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      </div>
  );
}
