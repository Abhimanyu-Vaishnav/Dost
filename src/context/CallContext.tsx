"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { 
  CallSessionData, stopAllRingtones, getOrCreateAudioContext, 
  triggerDeviceVibration, triggerSystemNotification 
} from "@/lib/callEngine";
import { CallOverlay } from "@/components/calls/CallOverlay";

interface CallContextType {
  activeSession: CallSessionData | null;
  startCall: (targetUserId: string, callType?: "voice" | "video", targetName?: string, targetAvatar?: string) => Promise<void>;
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
  const [myUserId, setMyUserId] = useState<string | undefined>(currentUserId);
  const callStartedTimeRef = useRef<number>(0);
  const notifiedSessionIdRef = useRef<string | null>(null);

  // Auto fetch user profile if currentUserId prop was omitted
  useEffect(() => {
    if (currentUserId) {
      setMyUserId(currentUserId);
    } else {
      fetch("/api/users/profile")
        .then(res => res.json())
        .then(data => {
          if (data.user?.id || data.user?.username) {
            setMyUserId(data.user.id || data.user.username);
          }
        })
        .catch(() => {});
    }
  }, [currentUserId]);

  // Poll call signaling status at 100ms ultra-high speed for instant sub-100ms call delivery
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
              notifiedSessionIdRef.current = null;
            } else {
              setActiveSession(sess);

              // Trigger WhatsApp-style device vibration & system notification for recipient
              const isRecipient = sess.status === "RINGING" && myUserId && (
                sess.recipientId === myUserId || sess.recipientName === myUserId
              );

              if (isRecipient && notifiedSessionIdRef.current !== sess.sessionId) {
                notifiedSessionIdRef.current = sess.sessionId;
                triggerDeviceVibration();
                triggerSystemNotification(sess.callerName, sess.callType);
              }
            }
          } else if (Date.now() - callStartedTimeRef.current > 5000) {
            setActiveSession(null);
            stopAllRingtones();
            notifiedSessionIdRef.current = null;
          }
        }
      } catch (e) {}
    }, 100);

    return () => clearInterval(interval);
  }, [myUserId]);

  const startCall = async (targetUserId: string, callType: "voice" | "video" = "voice", targetName?: string, targetAvatar?: string) => {
    try {
      getOrCreateAudioContext();
      callStartedTimeRef.current = Date.now();

      const displayName = targetName || targetUserId;
      const displayAvatar = targetAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=a855f7&color=ffffff`;

      const optimisticSession: CallSessionData = {
        sessionId: `call_${Date.now()}`,
        callerId: myUserId || "me",
        callerName: "me",
        callerAvatar: `https://ui-avatars.com/api/?name=User&background=00f2fe&color=ffffff`,
        recipientId: targetUserId,
        recipientName: displayName,
        recipientAvatar: displayAvatar,
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
      stopAllRingtones();
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
      notifiedSessionIdRef.current = null;
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
          currentUserId={myUserId || ""}
          onEndCall={endCall}
          onAcceptCall={acceptCall}
        />
      )}
    </CallContext.Provider>
  );
}
