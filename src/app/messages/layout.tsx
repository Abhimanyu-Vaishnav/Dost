"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { MessagesSidebar } from "@/features/messages/components/MessagesSidebar";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatActive = pathname.split("/").filter(Boolean).length > 1;

  return (
    <AppLayout fullWidth>
      <div className={isChatActive ? "messages-layout-active-chat" : "messages-layout-no-chat"} style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
        <div className="messages-sidebar-wrapper">
          <MessagesSidebar />
        </div>
        <div className="messages-chat-wrapper">
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
