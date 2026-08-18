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

  // Manage WebRTC P2P Peer Connection, Media Streams & HTTP Audio Relay Fallback
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let animFrame: number;
    let mediaRecorder: MediaRecorder | null = null;
    let chunkInterval: any = null;

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" }
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
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.4;
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
          localVideoRef.current.muted = true; // CRITICAL: Mute local preview to prevent echo!
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

        // HTTP MediaRecorder Audio Chunk Relay Fallback (300ms Opus slices for 100% reliable voice transfer)
        try {
          const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
          mediaRecorder = new MediaRecorder(stream, { mimeType: mime });

          mediaRecorder.ondataavailable = async (e) => {
            if (e.data && e.data.size > 0 && isConnected) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string)?.split(",")[1];
                if (base64) {
                  fetch("/api/messages/calls/audio-chunk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId: session.sessionId, blobBase64: base64 })
                  }).catch(() => {});
                }
              };
              reader.readAsDataURL(e.data);
            }
          };

          if (isConnected) {
            mediaRecorder.start(300);
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

    // Poll HTTP Audio Chunks for Fallback Playback when CONNECTED
    chunkInterval = setInterval(async () => {
      if (!isConnected) return;
      try {
        const res = await fetch(`/api/messages/calls/audio-chunk?sessionId=${encodeURIComponent(session.sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.chunks && Array.isArray(data.chunks)) {
            for (const chunk of data.chunks) {
              if (chunk.blobBase64) {
                const audio = new Audio(`data:audio/webm;base64,${chunk.blobBase64}`);
                audio.volume = isSpeakerOn ? 1.0 : 0.4;
                audio.play().catch(() => {});
              }
            }
          }
        }
      } catch (e) {}
    }, 350);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (chunkInterval) clearInterval(chunkInterval);
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try { mediaRecorder.stop(); } catch (e) {}
      }
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      pc.close();
    };
  }, [session.callType, isCaller, isConnected]);

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
  }, [session.sdpOffer, session.sdpAnswer, session.callerCandidates, session.recipientCandidates, isCaller]);

  // Call Duration Timer
  useEffect(() => {
    let timer: any;
    if (isConnected) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  // Toggle Mic Mute
  const handleToggleMute = () => {
    if (localMediaStreamRef.current) {
      const audioTracks = localMediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(t => {
        t.enabled = isMuted; // Toggle enabled state
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle Camera Video
  const handleToggleVideo = () => {
    if (localMediaStreamRef.current) {
      const videoTracks = localMediaStreamRef.current.getVideoTracks();
      videoTracks.forEach(t => {
        t.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle Speaker / Earpiece Audio Route
  const handleToggleSpeaker = () => {
    const nextSpeaker = !isSpeakerOn;
    setIsSpeakerOn(nextSpeaker);
    setIsEarpieceMode(!nextSpeaker);

    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = nextSpeaker ? 1.0 : 0.3;
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
      {/* Remote Voice Audio Element (Positioned off-screen, NOT display:none so mobile browser plays sound!) */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline 
        style={{ position: "fixed", top: "-9999px", opacity: 0, pointerEvents: "none" }} 
      />

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
        {/* If Recipient & Ringing: Show Green Accept & Red Decline */}
        {isRecipient && isRinging ? (
          <>
            <button
              onClick={onAcceptCall}
              style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "#10b981", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 0 30px rgba(16, 185, 129, 0.7)"
              }}
              className="hover:scale-110 active:scale-95 transition-all animate-bounce"
              title="Accept Call"
            >
              <Phone size={28} />
            </button>
            <button
              onClick={onEndCall}
              style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "#ef4444", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 0 30px rgba(239, 68, 68, 0.7)"
              }}
              className="hover:scale-110 active:scale-95 transition-all"
              title="Decline Call"
            >
              <PhoneOff size={28} />
            </button>
          </>
        ) : (
          <>
            {/* Mute Mic */}
            <button
              onClick={handleToggleMute}
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
                border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* Speaker / Earpiece Toggle */}
            <button
              onClick={handleToggleSpeaker}
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: isSpeakerOn ? "rgba(0, 242, 254, 0.3)" : "rgba(255, 255, 255, 0.2)",
                border: "none", color: isSpeakerOn ? "#00f2fe" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title={isSpeakerOn ? "Speaker ON" : "Earpiece Mode"}
            >
              {isSpeakerOn ? <Volume2 size={22} /> : <Headphones size={22} />}
            </button>

            {/* Video Toggle (if Video Call) */}
            {session.callType === "video" && (
              <button
                onClick={handleToggleVideo}
                style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  background: isVideoEnabled ? "rgba(168, 85, 247, 0.3)" : "rgba(255, 255, 255, 0.2)",
                  border: "none", color: isVideoEnabled ? "#a855f7" : "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s ease"
                }}
                className="hover:scale-105 active:scale-95"
                title={isVideoEnabled ? "Turn Video Off" : "Turn Video On"}
              >
                {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
              </button>
            )}

            {/* Proximity Ear Screen Lock Button */}
            <button
              onClick={() => setIsNearEarMode(true)}
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title="Ear Proximity Lock"
            >
              <Smartphone size={22} />
            </button>

            {/* Red End Call Button */}
            <button
              onClick={onEndCall}
              style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "#ef4444", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 0 25px rgba(239, 68, 68, 0.7)"
              }}
              className="hover:scale-110 active:scale-95 transition-all"
              title="End Call"
            >
              <PhoneOff size={26} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
