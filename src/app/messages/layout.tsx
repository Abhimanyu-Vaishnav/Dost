import { AppLayout } from "@/components/layout/AppLayout";
import { MessagesSidebar } from "@/features/messages/components/MessagesSidebar";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout fullWidth>
      <div style={{ display: "flex", height: "100%", width: "100%" }}>
        <MessagesSidebar />
        <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", minWidth: 0 }}>
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
