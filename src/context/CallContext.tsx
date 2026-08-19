"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { WebRTCService } from "@/lib/webrtc/webrtc-service";
import { useSSEPresence } from "@/hooks/useSSEPresence";

export type CallState = "IDLE" | "OUTGOING" | "INCOMING" | "CONNECTED" | "ENDED";
export type CallType = "VOICE" | "VIDEO";

export interface CallPartner {
  id: string;
  name: string;
  avatar: string;
}

export interface CallContextType {
  callState: CallState;
  callType: CallType;
  partner: CallPartner | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  isMuted: boolean;
  isCameraOff: boolean;
  isMinimized: boolean;
  rtcService: WebRTCService;
  startCall: (targetUser: CallPartner, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleMinimize: () => void;
  forcePlayAudio: () => void;
  reattachRemoteStream: () => void;
  enableAllTracks: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>("IDLE");
  const [callType, setCallType] = useState<CallType>("VOICE");
  const [partner, setPartner] = useState<CallPartner | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [pendingOffer, setPendingOffer] = useState<any | null>(null);

  const rtcServiceRef = useRef<WebRTCService>(new WebRTCService());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeCallIdRef = useRef<string | null>(null);

  const { registerCallSignalListener } = useSSEPresence(currentUserId);

  // Fetch current user details
  useEffect(() => {
    fetch("/api/users/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Handle Tab Unload / Page Refresh Edge Case
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callState !== "IDLE" && partner?.id) {
        const payload = JSON.stringify({
          targetUserId: partner.id,
          signalType: "call_end",
          callType,
          callId: activeCallIdRef.current,
        });
        navigator.sendBeacon("/api/calls/signal", payload);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [callState, partner, callType]);

  // Duration Timer when call is CONNECTED
  useEffect(() => {
    if (callState === "CONNECTED") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Listen for WebRTC SSE Signals
  const callStateRef = useRef<CallState>("IDLE");
  callStateRef.current = callState;

  // Listen for WebRTC SSE Signals
  useEffect(() => {
    if (!registerCallSignalListener) return;

    const unbind = registerCallSignalListener((payload: any) => {
      const { signalType, senderId, callType: incomingType, sdp, candidate, caller, callId } = payload;

      console.log("[CallContext] Received SSE Signal:", signalType, "from:", senderId, "callId:", callId);

      if (signalType === "call_offer") {
        if (callStateRef.current !== "IDLE" && activeCallIdRef.current !== callId) {
          console.log("[CallContext] Already in call, sending call_busy");
          sendSignal("call_busy", senderId, incomingType, callId);
          return;
        }

        activeCallIdRef.current = callId || `call_${Date.now()}`;
        setCallType(incomingType || "VOICE");
        const partnerObj = caller || {
          id: senderId,
          name: "Friend",
          avatar: "https://ui-avatars.com/api/?name=Friend",
        };
        setPartner(partnerObj);
        setPendingOffer(sdp);
        setCallState("INCOMING");

        // 1. Trigger Native Haptic Vibration Pattern
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate([400, 200, 400, 200, 400, 200, 800]);
          } catch (e) {}
        }

        // 2. Trigger System Push/Browser Notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(`Incoming ${incomingType === "VIDEO" ? "Video" : "Voice"} Call`, {
              body: `${partnerObj.name} is calling you on DOST...`,
              icon: partnerObj.avatar || "/icon.svg",
              tag: "dost_incoming_call",
            });
          } catch (e) {}
        }
      }

      if (signalType === "call_answer") {
        console.log("[CallContext] Received call_answer SDP from callee");
        if (sdp) {
          rtcServiceRef.current.handleAnswer(sdp).then(() => {
            setCallState("CONNECTED");
            console.log("[CallContext] Call CONNECTED successfully on caller side!");
          }).catch(err => {
            console.error("[CallContext] handleAnswer error:", err);
          });
        }
      }

      if (signalType === "ice_candidate") {
        if (candidate) {
          rtcServiceRef.current.addIceCandidate(candidate);
        }
      }

      if (signalType === "call_end" || signalType === "call_reject" || signalType === "call_busy") {
        console.log("[CallContext] Received termination signal:", signalType);
        handleCleanupAndReset();
      }
    });

    return unbind;
  }, [registerCallSignalListener]);

  // Send Signal helper to /api/calls/signal
  const sendSignal = async (
    signalType: string,
    targetUserId: string,
    type: CallType,
    callId?: string,
    extra: any = {}
  ) => {
    try {
      console.log("[CallContext] Sending signal:", signalType, "to:", targetUserId);
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          signalType,
          callType: type,
          callId: callId || activeCallIdRef.current,
          ...extra,
        }),
      });
    } catch (err) {
      console.error("[CallContext] sendSignal error:", err);
    }
  };

  // 1. CALLER: Start Call
  const startCall = async (targetUser: CallPartner, type: CallType) => {
    try {
      console.log("[CallContext] Starting call to:", targetUser.name);
      setPartner(targetUser);
      setCallType(type);
      setCallState("OUTGOING");
      setIsMuted(false);
      setIsCameraOff(false);

      const callId = `call_${Date.now()}`;
      activeCallIdRef.current = callId;

      // 1. Initialize peer connection
      rtcServiceRef.current.initPeerConnection(
        (candidate) => {
          sendSignal("ice_candidate", targetUser.id, type, callId, { candidate });
        },
        (remoteStream) => {
          console.log("[CallContext] Remote stream received in CallContext callback!");
          setRemoteStream(remoteStream);
        }
      );

      // 2. Get local stream & attach tracks BEFORE offer creation
      const localMedia = await rtcServiceRef.current.getLocalStream(type === "VIDEO");
      setLocalStream(localMedia);

      // 3. Create Offer with local tracks attached
      const offerSDP = await rtcServiceRef.current.createOffer();

      // 4. Send call_offer instantly
      await sendSignal("call_offer", targetUser.id, type, callId, {
        sdp: offerSDP,
        caller: {
          id: currentUserId,
          name: "DOST User",
          avatar: "https://ui-avatars.com/api/?name=User",
        },
      });
    } catch (err) {
      console.error("[CallContext] startCall error:", err);
      handleCleanupAndReset();
    }
  };

  // 2. CALLEE: Accept Call
  const acceptCall = async () => {
    if (!partner) {
      console.warn("[CallContext] Cannot accept call: missing partner");
      return;
    }

    try {
      console.log("[CallContext] Accepting incoming call from:", partner.name);
      setCallState("CONNECTED");

      // 1. Initialize callee peer connection FIRST
      rtcServiceRef.current.initPeerConnection(
        (candidate) => {
          sendSignal("ice_candidate", partner.id, callType, activeCallIdRef.current!, { candidate });
        },
        (remoteStream) => {
          console.log("[CallContext] Callee remote stream received!");
          setRemoteStream(remoteStream);
        }
      );

      // 2. Get callee local media & attach tracks
      try {
        const localMedia = await rtcServiceRef.current.getLocalStream(callType === "VIDEO");
        setLocalStream(localMedia);
      } catch (mediaErr) {
        console.warn("[CallContext] Media stream permission warning/fallback:", mediaErr);
      }

      // 3. Set remote offer & create answer if pendingOffer exists
      if (pendingOffer) {
        const answerSDP = await rtcServiceRef.current.handleOfferAndCreateAnswer(pendingOffer);

        // 4. Send call_answer signal to caller
        await sendSignal("call_answer", partner.id, callType, activeCallIdRef.current!, {
          sdp: answerSDP,
        });
      }

      setPendingOffer(null);
      console.log("[CallContext] Callee call connected successfully!");
    } catch (err) {
      console.error("[CallContext] acceptCall error:", err);
    }
  };

  // 3. CALLEE: Reject Call
  const rejectCall = async () => {
    if (partner) {
      await sendSignal("call_reject", partner.id, callType, activeCallIdRef.current!);
    }
    handleCleanupAndReset();
  };

  // 4. EITHER: End Call
  const endCall = async () => {
    if (partner) {
      await sendSignal("call_end", partner.id, callType, activeCallIdRef.current!, { duration: callDuration });
    }
    handleCleanupAndReset();
  };

  const handleCleanupAndReset = () => {
    console.log("[CallContext] Cleaning up call session...");
    setCallState("ENDED");
    rtcServiceRef.current.closeConnection();
    setLocalStream(null);
    setRemoteStream(null);
    setPendingOffer(null);
    activeCallIdRef.current = null;

    setTimeout(() => {
      setCallState("IDLE");
      setPartner(null);
      setIsMinimized(false);
    }, 1200);
  };

  // Controls
  const toggleMute = () => {
    const nextState = !isMuted;
    rtcServiceRef.current.toggleMute(nextState);
    setIsMuted(nextState);
  };

  const toggleCamera = () => {
    const nextState = !isCameraOff;
    rtcServiceRef.current.toggleCamera(nextState);
    setIsCameraOff(nextState);
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const forcePlayAudio = () => {
    console.log("[CallContext] Manual Debug: forcePlayAudio triggered");
    if (typeof window !== "undefined") {
      const audioEl = document.getElementById("remoteAudio") as HTMLAudioElement | null;
      if (audioEl) {
        if (remoteStream) {
          audioEl.srcObject = remoteStream;
        }
        audioEl.volume = 1.0;
        audioEl.muted = false;
        audioEl.play().then(() => console.log("[CallContext] Audio force played successfully!")).catch(e => console.error("Force play error:", e));
      }
    }
  };

  const reattachRemoteStream = () => {
    console.log("[CallContext] Manual Debug: reattachRemoteStream triggered");
    const stream = rtcServiceRef.current.getRemoteStream();
    if (stream) {
      setRemoteStream(null);
      setTimeout(() => {
        setRemoteStream(stream);
      }, 50);
    }
  };

  const enableAllTracks = () => {
    console.log("[CallContext] Manual Debug: enableAllTracks triggered");
    rtcServiceRef.current.forceEnableAllTracks();
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        partner,
        localStream,
        remoteStream,
        callDuration,
        isMuted,
        isCameraOff,
        isMinimized,
        rtcService: rtcServiceRef.current,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        toggleMinimize,
        forcePlayAudio,
        reattachRemoteStream,
        enableAllTracks,
      }}
    >
      {children}
      <audio id="remoteAudio" autoPlay playsInline style={{ display: "none" }} />
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
