"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export interface PresenceInfo {
  userId: string;
  isOnline: boolean;
  lastSeen: string | Date;
}

export interface TypingInfo {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface SSEMessageEvent {
  message?: any;
  event?: string;
  messageId?: string;
  messageIds?: string[];
  conversationId?: string;
  readerId?: string;
  newContent?: string;
  mode?: string;
}

export function useSSEPresence(currentUserId?: string) {
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceInfo>>({});
  const [typingMap, setTypingMap] = useState<Record<string, string>>({}); // userId -> conversationId
  const [connected, setConnected] = useState(false);
  const messageListenersRef = useRef<Set<(event: SSEMessageEvent) => void>>(new Set());
  const callSignalListenersRef = useRef<Set<(payload: any) => void>>(new Set());

  const registerMessageListener = useCallback((listener: (event: SSEMessageEvent) => void) => {
    messageListenersRef.current.add(listener);
    return () => {
      messageListenersRef.current.delete(listener);
    };
  }, []);

  const registerCallSignalListener = useCallback((listener: (payload: any) => void) => {
    callSignalListenersRef.current.add(listener);
    return () => {
      callSignalListenersRef.current.delete(listener);
    };
  }, []);

  // 15-second heartbeat
  useEffect(() => {
    if (!currentUserId) return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/presence/heartbeat", { method: "POST" });
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // SSE Stream Connection
  useEffect(() => {
    if (!currentUserId) return;

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`/api/sse?userId=${encodeURIComponent(currentUserId)}`);

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "presence_update") {
            const { userId, isOnline, lastSeen, event: subEvent } = data.payload;

            if (userId) {
              setPresenceMap((prev) => ({
                ...prev,
                [userId]: {
                  userId,
                  isOnline: Boolean(isOnline),
                  lastSeen: lastSeen || new Date().toISOString(),
                },
              }));
            }

            if (subEvent === "message_read") {
              messageListenersRef.current.forEach((fn) => fn(data.payload));
            }
          } else if (data.type === "typing_update") {
            const { userId, conversationId, isTyping } = data.payload as TypingInfo;
            setTypingMap((prev) => {
              const updated = { ...prev };
              if (isTyping) {
                updated[userId] = conversationId;
              } else {
                delete updated[userId];
              }
              return updated;
            });
          } else if (data.type === "message_new") {
            messageListenersRef.current.forEach((fn) => fn(data.payload));
          } else if (data.type === "call_signal") {
            callSignalListenersRef.current.forEach((fn) => fn(data.payload));
          }
        } catch (err) {
          console.error("Error parsing SSE event:", err);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
      };
    } catch (err) {
      console.error("SSE connection setup error:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [currentUserId]);

  const sendTyping = useCallback(async (conversationId: string, isTyping: boolean) => {
    try {
      await fetch("/api/presence/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, isTyping }),
      });
    } catch (err) {
      console.error("Send typing error:", err);
    }
  }, []);

  return {
    presenceMap,
    typingMap,
    connected,
    registerMessageListener,
    registerCallSignalListener,
    sendTyping,
  };
}
