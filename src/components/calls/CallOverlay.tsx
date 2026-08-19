"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCall } from "@/context/CallContext";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
  Volume2,
} from "lucide-react";

export function CallOverlay() {
  const {
    callState,
    callType,
    partner,
    localStream,
    remoteStream,
    callDuration,
    isMuted,
    isCameraOff,
    isMinimized,
    rtcService,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleMinimize,
    forcePlayAudio,
    reattachRemoteStream,
    enableAllTracks,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [audioMode, setAudioMode] = React.useState<"speaker" | "earpiece">("earpiece");
  const [telemetry, setTelemetry] = React.useState<any>({});

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video & audio element
  useEffect(() => {
    if (remoteStream) {
      console.log("[CallOverlay] Attaching remoteStream tracks:", remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      
      // Ensure all remote audio tracks are explicitly enabled
      remoteStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current
          .play()
          .then(() => console.log("[CallOverlay] Remote audio playing loud and clear!"))
          .catch((e) => console.warn("[CallOverlay] Audio play warning:", e));
      }
    }
  }, [remoteStream]);

  // Live Telemetry Loop (Updates every 800ms)
  useEffect(() => {
    if (callState === "IDLE") return;

    const interval = setInterval(() => {
      const pc = rtcService?.getPeerConnection();
      const localAudioTrack = localStream?.getAudioTracks()[0];
      const remoteAudioTrack = remoteStream?.getAudioTracks()[0];
      const audioEl = remoteAudioRef.current || (typeof window !== "undefined" ? (document.getElementById("remoteAudio") as HTMLAudioElement) : null);

      setTelemetry({
        pcConnectionState: pc?.connectionState || "none",
        iceConnectionState: pc?.iceConnectionState || "none",
        localTrack: localAudioTrack ? `enabled:${localAudioTrack.enabled}, muted:${localAudioTrack.muted}, state:${localAudioTrack.readyState}` : "none",
        remoteTrack: remoteAudioTrack ? `enabled:${remoteAudioTrack.enabled}, muted:${remoteAudioTrack.muted}, state:${remoteAudioTrack.readyState}` : "none",
        audioElement: audioEl ? `paused:${audioEl.paused}, vol:${audioEl.volume}, muted:${audioEl.muted}` : "none",
      });
    }, 800);

    return () => clearInterval(interval);
  }, [callState, localStream, remoteStream, rtcService]);

  if (callState === "IDLE") return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 1. MINIMIZED CALL FLOATING PILL
  if (isMinimized && callState === "CONNECTED") {
    return (
      <motion.div
        key="call-overlay-minimized-view"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          backgroundColor: "#0d1017",
          border: "1px solid rgba(0, 242, 254, 0.4)",
          borderRadius: 9999,
          boxShadow: "0 10px 30px rgba(0, 242, 254, 0.3)",
          color: "#ffffff",
        }}
      >
        <div style={{ position: "relative", width: 36, height: 36 }}>
          <img
            src={partner?.avatar || "https://ui-avatars.com/api/?name=User"}
            alt={partner?.name}
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
          />
          <span
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              backgroundColor: "#10b981",
              borderRadius: "50%",
              border: "2px solid #0d1017",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
            {partner?.name || "Call"}
          </span>
          <span style={{ fontSize: "0.72rem", color: "#00f2fe", fontWeight: 600 }}>
            {formatTimer(callDuration)}
          </span>
        </div>

        <button
          onClick={toggleMinimize}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            color: "#ffffff",
            padding: 8,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
          }}
          title="Maximize Call"
        >
          <Maximize2 size={16} />
        </button>

        <button
          onClick={endCall}
          style={{
            background: "#f87171",
            border: "none",
            color: "#ffffff",
            padding: 8,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
          }}
          title="End Call"
        >
          <PhoneOff size={16} />
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="call-overlay-active-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#05070a",
          padding: "40px 24px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Remote Video Container (When Video Call Connected) */}
        {callType === "VIDEO" && callState === "CONNECTED" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              backgroundColor: "#000000",
            }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Local Video Float (Picture in Picture) */}
            <div
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                width: 140,
                height: 200,
                borderRadius: 18,
                overflow: "hidden",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                backgroundColor: "#000000",
                zIndex: 10,
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        )}

        {/* Ambient Glowing Background Circles */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* TOP CALL HEADER */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#00f2fe",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "4px 14px",
              backgroundColor: "rgba(0, 242, 254, 0.1)",
              borderRadius: 9999,
              border: "1px solid rgba(0, 242, 254, 0.2)",
            }}
          >
            {callType === "VIDEO" ? "HD Video Call" : "Voice Call"}
          </span>

          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", margin: "6px 0 0 0" }}>
            {partner?.name || "DOST Friend"}
          </h2>

          <span style={{ fontSize: "0.88rem", color: "#94a3b8", fontWeight: 500 }}>
            {callState === "OUTGOING" && "Ringing..."}
            {callState === "INCOMING" && "Incoming Call..."}
            {callState === "CONNECTED" && formatTimer(callDuration)}
            {callState === "ENDED" && "Call Ended"}
          </span>
        </div>

        {/* CENTER AVATAR DISPLAY (FOR VOICE CALL OR OUTGOING/INCOMING) */}
        {(callType === "VOICE" || callState !== "CONNECTED") && (
          <div
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "auto 0",
            }}
          >
            {/* Pulsing Ring for Ringing/Incoming */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                position: "absolute",
                width: 190,
                height: 190,
                borderRadius: "50%",
                border: "2px solid #00f2fe",
              }}
            />

            <img
              src={partner?.avatar || "https://ui-avatars.com/api/?name=User"}
              alt={partner?.name}
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid rgba(0, 242, 254, 0.5)",
                boxShadow: "0 0 40px rgba(0, 242, 254, 0.4)",
              }}
            />
          </div>
        )}

        {/* BOTTOM CONTROL BAR */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "16px 28px",
            backgroundColor: "rgba(16, 18, 24, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 9999,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* INCOMING CALL CONTROLS: ACCEPT & REJECT */}
          {callState === "INCOMING" && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.play().catch(() => {});
                  }
                  acceptCall();
                }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  border: "none",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(16, 185, 129, 0.6)",
                }}
              >
                <Phone size={26} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={rejectCall}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  border: "none",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(239, 68, 68, 0.6)",
                }}
              >
                <PhoneOff size={26} />
              </motion.button>
            </>
          )}

          {/* CONNECTED / OUTGOING CALL CONTROLS */}
          {callState !== "INCOMING" && (
            <>
              {/* Mute Mic */}
              <button
                onClick={toggleMute}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  backgroundColor: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Earpiece / Speaker Output Toggle */}
              <button
                onClick={async () => {
                  const newMode = await rtcService.setAudioOutputDevice(audioMode);
                  setAudioMode(newMode);
                }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  backgroundColor: audioMode === "speaker" ? "rgba(0, 242, 254, 0.35)" : "rgba(255, 255, 255, 0.1)",
                  border: audioMode === "speaker" ? "1px solid #00f2fe" : "1px solid rgba(255, 255, 255, 0.15)",
                  color: audioMode === "speaker" ? "#00f2fe" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title={audioMode === "speaker" ? "Switch to Earpiece" : "Switch to Loudspeaker"}
              >
                <Volume2 size={20} />
              </button>

              {/* Toggle Camera (If Video Call) */}
              {callType === "VIDEO" && (
                <button
                  onClick={toggleCamera}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    backgroundColor: isCameraOff ? "#ef4444" : "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              {/* Minimize Call */}
              {callState === "CONNECTED" && (
                <button
                  onClick={toggleMinimize}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Minimize"
                >
                  <Minimize2 size={20} />
                </button>
              )}

              {/* End Call */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={endCall}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  border: "none",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 0 25px rgba(239, 68, 68, 0.5)",
                }}
                title="End Call"
              >
                <PhoneOff size={24} />
              </motion.button>
            </>
          )}
        </div>

        {/* LIVE AUDIO TELEMETRY & DEBUG ACTION BUTTONS */}
        {callState === "CONNECTED" && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              border: "1px solid rgba(0, 242, 254, 0.25)",
              borderRadius: "14px",
              fontSize: "0.72rem",
              color: "#94a3b8",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#00f2fe", fontWeight: 700 }}>
              <span>PC: {telemetry.pcConnectionState}</span>
              <span>ICE: {telemetry.iceConnectionState}</span>
            </div>

            <div style={{ fontSize: "0.68rem", display: "flex", flexDirection: "column", gap: 2 }}>
              <span>Local Track: {telemetry.localTrack}</span>
              <span>Remote Track: {telemetry.remoteTrack}</span>
              <span>Audio Element: {telemetry.audioElement}</span>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={forcePlayAudio}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(0, 242, 254, 0.15)",
                  border: "1px solid rgba(0, 242, 254, 0.4)",
                  color: "#00f2fe",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Force Play Audio
              </button>
              <button
                onClick={reattachRemoteStream}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Re-attach Stream
              </button>
              <button
                onClick={enableAllTracks}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  color: "#10b981",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Enable All Tracks
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
    </AnimatePresence>
  );
}
