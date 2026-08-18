"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { CallSessionData, stopAllRingtones, getOrCreateAudioContext } from "@/lib/callEngine";
import { CallOverlay } from "@/components/calls/CallOverlay";

interface CallContextType {
  activeSession: CallSessionData | null;
  startCall: (targetUserId: string, callType?: "voice" | "video") => Promise<void>;
  endCall: () => Promise<void>;
  acceptCall: () => Promise<void>;
}

const CallContext = createContext<CallContextType>({
  activeSession: null,
  startCall: async () => {},
  endCall: async () => {},
  acceptCall: async () => {}
});

export const useCall = () => useContext(CallContext);

export function CallProvider({ children, currentUserId }: { children: React.ReactNode; currentUserId?: string }) {
  const [activeSession, setActiveSession] = useState<CallSessionData | null>(null);
  const callStartedTimeRef = useRef<number>(0);

  // Poll call signaling status every 150ms (with 5s grace period for instant call initiation)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/calls/signal");
        if (res.ok) {
          const data = await res.json();
          const sess: CallSessionData | null = data.session || null;
          if (sess) {
            if (sess.status === "REJECTED" || sess.status === "ENDED") {
              setActiveSession(null);
              stopAllRingtones();
            } else {
              setActiveSession(sess);
            }
          } else if (Date.now() - callStartedTimeRef.current > 5000) {
            setActiveSession(null);
            stopAllRingtones();
          }
        }
      } catch (e) {}
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const startCall = async (targetUserId: string, callType: "voice" | "video" = "voice") => {
    try {
      getOrCreateAudioContext();
      callStartedTimeRef.current = Date.now();

      // Instant 0ms optimistic session setup so CallOverlay opens IMMEDIATELY
      const optimisticSession: CallSessionData = {
        sessionId: `call_${Date.now()}`,
        callerId: currentUserId || "me",
        callerName: "Calling...",
        callerAvatar: `https://ui-avatars.com/api/?name=User&background=00f2fe&color=ffffff`,
        recipientId: targetUserId,
        recipientName: targetUserId,
        recipientAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUserId)}&background=a855f7&color=ffffff`,
        callType,
        status: "RINGING",
        updatedAt: Date.now()
      };

      setActiveSession(optimisticSession);

      const res = await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "OFFER",
          toUserId: targetUserId,
          callType
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) setActiveSession(data.session);
      }
    } catch (e) {
      console.error("Start call error:", e);
    }
  };

  const acceptCall = async () => {
    try {
      getOrCreateAudioContext();
      const res = await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ANSWER" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) setActiveSession(data.session);
      }
    } catch (e) {
      console.error("Accept call error:", e);
    }
  };

  const endCall = async () => {
    try {
      stopAllRingtones();
      setActiveSession(null);
      callStartedTimeRef.current = 0;
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END" })
      });
    } catch (e) {
      console.error("End call error:", e);
    }
  };

  return (
    <CallContext.Provider value={{ activeSession, startCall, endCall, acceptCall }}>
      {children}
      {activeSession && (
        <CallOverlay
          session={activeSession}
          currentUserId={currentUserId || ""}
          onEndCall={endCall}
          onAcceptCall={acceptCall}
        />
      )}
    </CallContext.Provider>
  );
}
