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
  const [myProfile, setMyProfile] = useState<{ name: string; username: string; avatar: string } | null>(null);

  const callStartedTimeRef = useRef<number>(0);
  const notifiedSessionIdRef = useRef<string | null>(null);
  const endedSessionIdsRef = useRef<Set<string>>(new Set());

  // Fetch current user profile
  useEffect(() => {
    fetch("/api/users/profile")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setMyUserId(data.user.id || data.user.username);
          setMyProfile({
            name: data.user.name || data.user.username || "User",
            username: data.user.username ? data.user.username.replace("@", "") : "user",
            avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name || "User")}`
          });
        }
      })
      .catch(() => {});
  }, [currentUserId]);

  // Real-Time SSE Listener for Instant Call Signaling Synchronization
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/calls/sse");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle CALL_TERMINATED Signal (Hangup / Decline)
          if (data.type === "CALL_TERMINATED") {
            setActiveSession(null);
            stopAllRingtones();
            notifiedSessionIdRef.current = null;
            if (data.session?.sessionId) endedSessionIdsRef.current.add(data.session.sessionId);
            return;
          }

          // Handle CALL_ACCEPTED Signal
          if (data.type === "CALL_ACCEPTED" && data.session) {
            setActiveSession(data.session);
            stopAllRingtones();
            return;
          }

          // Handle CALL_SIGNAL (Offer / SDP / Candidate)
          if (data.type === "CALL_SIGNAL" && data.session) {
            const sess: CallSessionData = data.session;

            if (endedSessionIdsRef.current.has(sess.sessionId) || sess.status === "REJECTED" || sess.status === "ENDED") {
              setActiveSession(null);
              stopAllRingtones();
              notifiedSessionIdRef.current = null;
            } else {
              setActiveSession(sess);

              // Ringtone & Vibration for Recipient (< 10ms)
              const isRecipient = sess.status === "RINGING" && myUserId && (
                sess.recipientId === myUserId || sess.recipientName === myUserId
              );

              if (isRecipient && notifiedSessionIdRef.current !== sess.sessionId) {
                notifiedSessionIdRef.current = sess.sessionId;
                triggerDeviceVibration();
                triggerSystemNotification(sess.callerName || "Friend", sess.callType);
              }
            }
          }
        } catch (e) {}
      };
    } catch (e) {}

    // Polling fallback every 500ms
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/calls/signal");
        if (res.ok) {
          const data = await res.json();
          const sess: CallSessionData | null = data.session || null;

          if (sess) {
            if (endedSessionIdsRef.current.has(sess.sessionId) || sess.status === "REJECTED" || sess.status === "ENDED") {
              setActiveSession(null);
              stopAllRingtones();
              notifiedSessionIdRef.current = null;
            } else {
              setActiveSession(sess);
            }
          } else if (activeSession) {
            setActiveSession(null);
            stopAllRingtones();
            notifiedSessionIdRef.current = null;
          }
        }
      } catch (e) {}
    }, 500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [myUserId, activeSession]);

  // Ringing 40-second Timeout Cleanup
  useEffect(() => {
    let timer: any;
    if (activeSession && activeSession.status === "RINGING") {
      timer = setTimeout(() => {
        endCall();
      }, 40000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [activeSession?.status, activeSession?.sessionId]);

  const startCall = async (targetUserId: string, callType: "voice" | "video" = "voice", targetName?: string, targetAvatar?: string) => {
    try {
      getOrCreateAudioContext();
      if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
      }

      callStartedTimeRef.current = Date.now();

      const displayName = targetName || targetUserId;
      const displayAvatar = targetAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00f2fe&color=ffffff`;

      const callerRealName = myProfile?.name || myProfile?.username || "Friend";
      const callerRealAvatar = myProfile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerRealName)}`;

      const optimisticSession: CallSessionData = {
        sessionId: `call_${Date.now()}`,
        callerId: myUserId || "me",
        callerName: callerRealName,
        callerAvatar: callerRealAvatar,
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
          callType,
          callerName: callerRealName,
          callerAvatar: callerRealAvatar
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setActiveSession(data.session);
        }
      }
    } catch (e) {
      console.error("Start call error:", e);
    }
  };

  const acceptCall = async () => {
    if (!activeSession) return;
    try {
      getOrCreateAudioContext();
      stopAllRingtones();

      const updated = { ...activeSession, status: "CONNECTED" as const, updatedAt: Date.now() };
      setActiveSession(updated);

      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ANSWER" })
      });
    } catch (e) {
      console.error("Accept call error:", e);
    }
  };

  const endCall = async () => {
    if (!activeSession) return;
    const sessId = activeSession.sessionId;
    endedSessionIdsRef.current.add(sessId);
    setActiveSession(null);
    stopAllRingtones();
    notifiedSessionIdRef.current = null;

    try {
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
      {activeSession && myUserId && (
        <CallOverlay
          session={activeSession}
          currentUserId={myUserId}
          onEndCall={endCall}
          onAcceptCall={acceptCall}
        />
      )}
    </CallContext.Provider>
  );
}
