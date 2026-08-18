"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, Video, VideoOff, 
  Shield, PhoneCall, MicOff as MicMutedIcon, Smartphone, Headphones
} from "lucide-react";
import { 
  CallSessionData, startOutgoingRingbackSound, 
  startIncomingCallerTuneSound, stopAllRingtones, getOrCreateAudioContext 
} from "@/lib/callEngine";

interface CallOverlayProps {
  session: CallSessionData;
  currentUserId: string;
  onEndCall: () => void;
  onAcceptCall: () => void;
}

export function CallOverlay({ session, currentUserId, onEndCall, onAcceptCall }: CallOverlayProps) {
  const isRecipient = Boolean(currentUserId && (currentUserId === session.recipientId || currentUserId === session.recipientName));
  const isCaller = session.callerId === "me" || session.callerName === "me" || (!isRecipient && (currentUserId ? (currentUserId === session.callerId || currentUserId === session.callerName) : true));
  const isRinging = session.status === "RINGING";
  const isConnected = session.status === "CONNECTED";

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isEarpieceMode, setIsEarpieceMode] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isNearEarMode, setIsNearEarMode] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const processedIceCandidatesRef = useRef<Set<string>>(new Set());

  const otherPersonName = isCaller ? (session.recipientName || "Recipient") : session.callerName;
  const otherPersonAvatar = isCaller ? (session.recipientAvatar || session.callerAvatar) : session.callerAvatar;

  // Manage Ringtone Sound Engine
  useEffect(() => {
    if (isRinging) {
      if (isCaller) {
        startOutgoingRingbackSound();
      } else {
        startIncomingCallerTuneSound();
      }
    } else {
      stopAllRingtones();
    }

    return () => {
      stopAllRingtones();
    };
  }, [isRinging, isCaller]);

  // Manage WebRTC P2P Peer Connection & Media Streams
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let animFrame: number;

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Handle Remote Audio/Video Track Received
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);

      if (event.track.kind === "video" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.3;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    // Send Local ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        fetch("/api/calls/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ICE_CANDIDATE", candidate: event.candidate })
        }).catch(() => {});
      }
    };

    async function initMedia() {
      try {
        if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: session.callType === "video",
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        }).catch(async () => {
          return await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        });

        if (!stream) return;

        activeStream = stream;
        localMediaStreamRef.current = stream;

        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Live mic equalizer wave frequency analyser
        try {
          const ctx = getOrCreateAudioContext();
          if (ctx) {
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVolume = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setVoiceVolume(Math.min(100, Math.round((avg / 128) * 100)));
              animFrame = requestAnimationFrame(updateVolume);
            };
            updateVolume();
          }
        } catch (e) {}

        // If caller: Send WebRTC SDP Offer
        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          fetch("/api/calls/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "SDP_OFFER", sdp: offer })
          }).catch(() => {});
        }
      } catch (e) {
        console.error("Init call media error:", e);
      }
    }

    initMedia();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      pc.close();
    };
  }, [session.callType, isCaller]);

  // Exchange WebRTC SDP Answer & ICE Candidates
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    async function handleSignalingExchange() {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        // Recipient handles SDP Offer
        if (!isCaller && session.sdpOffer && !pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(session.sdpOffer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          fetch("/api/calls/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "SDP_ANSWER", sdp: answer })
          }).catch(() => {});
        }

        // Caller handles SDP Answer
        if (isCaller && session.sdpAnswer && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(session.sdpAnswer));
        }

        // Process Candidates
        const candidates = !isCaller ? session.callerCandidates : session.recipientCandidates;
        if (candidates && candidates.length > 0) {
          for (const cand of candidates) {
            const candStr = JSON.stringify(cand);
            if (!processedIceCandidatesRef.current.has(candStr)) {
              processedIceCandidatesRef.current.add(candStr);
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          }
        }
      } catch (e) {}
    }

    handleSignalingExchange();
  }, [session, isCaller]);

  // Call timer
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setCallDuration(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Mute & Video Toggles
  useEffect(() => {
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getVideoTracks().forEach(t => t.enabled = isVideoEnabled);
    }
  }, [isVideoEnabled]);

  const handleAcceptButtonClick = () => {
    try {
      getOrCreateAudioContext();
      const unlock = new Audio();
      unlock.play().catch(() => {});
    } catch (e) {}
    onAcceptCall();
  };

  const handleEndCallButtonClick = () => {
    stopAllRingtones();
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    onEndCall();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div 
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        backgroundColor: isNearEarMode ? "rgba(0, 0, 0, 0.99)" : "rgba(0, 0, 0, 0.92)",
        backdropFilter: isNearEarMode ? "none" : "blur(36px)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between", padding: "48px 24px", overflow: "hidden"
      }}
      className="animate-fade-in"
    >
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      {/* Near Ear Black Screen Overlay */}
      {isNearEarMode && (
        <div 
          onClick={() => setIsNearEarMode(false)}
          style={{
            position: "absolute", inset: 0, background: "#000000", zIndex: 9999,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "rgba(255, 255, 255, 0.4)", gap: "12px", cursor: "pointer"
          }}
        >
          <Smartphone size={32} />
          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Proximity Screen Lock • Tap anywhere to wake screen</span>
        </div>
      )}

      {/* Ambient Artwork */}
      <div 
        style={{
          position: "absolute", inset: 0, backgroundImage: `url(${otherPersonAvatar})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(65px) brightness(0.22)", opacity: 0.65, transform: "scale(1.1)", zIndex: 0
        }} 
      />

      {/* Header Info */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 2 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255, 255, 255, 0.12)", padding: "6px 18px",
          borderRadius: "9999px", color: "white", fontSize: "0.85rem", fontWeight: 800,
          border: "1px solid rgba(255, 255, 255, 0.2)", backdropFilter: "blur(12px)"
        }}>
          <Shield size={16} style={{ color: "#10b981" }} /> End-to-End Encrypted {session.callType === "voice" ? "Voice" : "Video"} Call
        </div>

        <h2 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#ffffff", margin: "14px 0 2px 0", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
          {otherPersonName}
        </h2>
        
        <span style={{ 
          fontSize: "1rem", 
          color: isConnected ? "#10b981" : "#00f2fe", 
          fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" 
        }}>
          {isRinging ? (
            <>
              <PhoneCall size={16} className="animate-pulse" /> {isCaller ? "Calling... (Ringing)" : "Incoming Call..."}
            </>
          ) : (
            `Connected • ${formatTimer(callDuration)}`
          )}
        </span>
      </div>

      {/* Center Display / Equalizer */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", width: "100%", maxHeight: "520px", flex: 1, zIndex: 2 }}>
        {session.callType === "voice" ? (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              position: "absolute", width: `${180 + voiceVolume * 1.2}px`, height: `${180 + voiceVolume * 1.2}px`,
              borderRadius: "50%", border: "3px solid rgba(0, 242, 254, 0.7)", boxShadow: "0 0 30px rgba(0, 242, 254, 0.4)",
              transition: "all 0.08s ease-out", opacity: isMuted ? 0.2 : 0.8
            }} />
            <img
              src={otherPersonAvatar}
              alt={otherPersonName}
              style={{
                width: "160px", height: "160px", borderRadius: "50%", objectFit: "cover",
                border: "4px solid #00f2fe", boxShadow: "0 0 50px rgba(0, 242, 254, 0.5)", zIndex: 2
              }}
            />
          </div>
        ) : (
          <div style={{
            width: "100%", maxWidth: "640px", height: "100%", minHeight: "360px",
            borderRadius: "28px", overflow: "hidden", background: "#111111", position: "relative",
            border: "1px solid rgba(255, 255, 255, 0.2)", boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
          }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{
              position: "absolute", bottom: "20px", right: "20px", width: "120px", height: "160px",
              borderRadius: "18px", background: "#000", border: "2px solid rgba(255, 255, 255, 0.4)", overflow: "hidden"
            }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div style={{
        display: "flex", alignItems: "center", gap: "20px",
        background: "rgba(255, 255, 255, 0.14)", padding: "14px 28px",
        borderRadius: "9999px", border: "1px solid rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(24px)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 2
      }}>
        {!isCaller && isRinging ? (
          <>
            <button
              onClick={handleEndCallButtonClick}
              style={{
                width: "68px", height: "68px", borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(239, 68, 68, 0.6)"
              }}
            >
              <PhoneOff size={30} />
            </button>
            <button
              onClick={handleAcceptButtonClick}
              style={{
                width: "76px", height: "76px", borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 36px rgba(16, 185, 129, 0.65)"
              }}
              className="animate-bounce"
            >
              <Phone size={34} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsMuted(!isMuted)}
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
                color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            <button
              onClick={() => {
                setIsSpeakerOn(!isSpeakerOn);
                setIsEarpieceMode(isSpeakerOn);
                if (remoteAudioRef.current) remoteAudioRef.current.volume = isSpeakerOn ? 0.3 : 1.0;
              }}
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: isEarpieceMode ? "#8b5cf6" : "rgba(255, 255, 255, 0.2)",
                color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {isEarpieceMode ? <Headphones size={22} /> : <Volume2 size={22} />}
            </button>

            <button
              onClick={() => setIsNearEarMode(true)}
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)", color: "white", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <Smartphone size={22} />
            </button>

            <button
              onClick={handleEndCallButtonClick}
              style={{
                width: "60px", height: "60px", borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 10px 30px rgba(239, 68, 68, 0.65)"
              }}
            >
              <PhoneOff size={26} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
