"use client";

import { useEffect } from "react";
import { Phone, PhoneOff, Video, Shield } from "lucide-react";
import { CallSession } from "@/lib/callSignalStore";

interface IncomingCallModalProps {
  session: CallSession;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallModal({ session, onAccept, onDecline }: IncomingCallModalProps) {
  // Web Audio Ringing Chime for incoming call
  useEffect(() => {
    let timer: any = null;

    const playRingtone = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.4);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(880, now + 0.4);
        osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.8);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.4);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      } catch (e) {}
    };

    playRingtone();
    timer = setInterval(playRingtone, 2200);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const handleAcceptClick = () => {
    try {
      const unlockAudio = new Audio();
      unlockAudio.play().catch(() => {});
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume().catch(() => {});
      }
    } catch (e) {}
    onAccept();
  };

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0, 0, 0, 0.90)",
        backdropFilter: "blur(32px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "60px 24px",
        overflow: "hidden"
      }} 
      className="animate-fade-in"
    >
      {/* Ambient Blurred Avatar Background */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${session.callerAvatar})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(60px) brightness(0.25)",
          opacity: 0.7,
          transform: "scale(1.1)",
          zIndex: 0
        }} 
      />

      {/* Top Security Pill */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 2 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255, 255, 255, 0.12)", padding: "6px 18px",
          borderRadius: "9999px", color: "white", fontSize: "0.85rem", fontWeight: 800,
          border: "1px solid rgba(255, 255, 255, 0.2)", backdropFilter: "blur(12px)"
        }}>
          <Shield size={16} style={{ color: "#10b981" }} /> Incoming End-to-End Encrypted {session.callType === "voice" ? "Voice" : "Video"} Call
        </div>

        <h2 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#ffffff", margin: "16px 0 2px 0" }}>
          {session.callerName}
        </h2>
        <span style={{ fontSize: "1.05rem", color: "#00f2fe", fontWeight: 800 }} className="animate-pulse">
          Is calling you live...
        </span>
      </div>

      {/* Center Caller Avatar Display */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          position: "absolute", width: "210px", height: "210px", borderRadius: "50%",
          border: "3px solid rgba(0, 242, 254, 0.6)", boxShadow: "0 0 40px rgba(0, 242, 254, 0.4)",
          animation: "ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite"
        }} />
        <img
          src={session.callerAvatar}
          alt={session.callerName}
          style={{
            width: "160px", height: "160px", borderRadius: "50%", objectFit: "cover",
            border: "4px solid #00f2fe", boxShadow: "0 0 50px rgba(0, 242, 254, 0.5)",
            zIndex: 2
          }}
        />
      </div>

      {/* Action Buttons: Accept / Decline */}
      <div style={{ display: "flex", alignItems: "center", gap: "40px", zIndex: 2 }}>
        {/* Decline Button */}
        <button
          onClick={onDecline}
          style={{
            width: "68px", height: "68px", borderRadius: "50%",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 30px rgba(239, 68, 68, 0.6)"
          }}
          className="hover:scale-110 active:scale-95 transition-all"
          title="Decline Call"
        >
          <PhoneOff size={30} />
        </button>

        {/* Accept Button */}
        <button
          onClick={handleAcceptClick}
          style={{
            width: "76px", height: "76px", borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 12px 36px rgba(16, 185, 129, 0.65)"
          }}
          className="hover:scale-110 active:scale-95 transition-all animate-bounce"
          title="Accept Call"
        >
          {session.callType === "video" ? <Video size={34} /> : <Phone size={34} />}
        </button>
      </div>
    </div>
  );
}
