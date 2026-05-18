"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function NotificationClient() {
  const router = useRouter();

  useEffect(() => {
    // Mark all notifications as read when entering the page
    fetch("/api/notifications/mark-read", { method: "POST" })
      .then(() => {
        // Optional: refresh to clear badges elsewhere if needed
        router.refresh();
      })
      .catch(console.error);
  }, [router]);

  return null;
}
