"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, Video, VideoOff, 
  Shield, PhoneCall, MicOff as MicMutedIcon, Smartphone, Headphones, Play, VolumeX
} from "lucide-react";
import { 
  CallSessionData, startOutgoingRingbackSound, 
  startIncomingCallerTuneSound, stopAllRingtones, getOrCreateAudioContext,
  claimSystemAudioSession, releaseSystemAudioSession
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
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const processedIceCandidatesRef = useRef<Set<string>>(new Set());

  const otherPersonName = isCaller ? (session.recipientName || "Recipient") : session.callerName;
  const otherPersonAvatar = isCaller ? (session.recipientAvatar || session.callerAvatar) : session.callerAvatar;

  // Claim System Audio Session (Pauses background Spotify / YouTube & assigns priority to DOST Call)
  useEffect(() => {
    claimSystemAudioSession(otherPersonName, session.callType);
    return () => {
      releaseSystemAudioSession();
    };
  }, [otherPersonName, session.callType]);

  // User Tap Audio Unlocker
  const unlockAndPlay = async () => {
    try {
      const ctx = getOrCreateAudioContext();
      if (ctx && ctx.state === "suspended") await ctx.resume();
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.2;
        await remoteAudioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {});
      }
    } catch (e) {}
  };

  // Bind Remote Stream to Audio Element whenever available
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.2;
      remoteAudioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {
        setIsAudioPlaying(false);
      });
    }
  }, [remoteStream, isConnected, isSpeakerOn]);

  // Ringtone Management
  useEffect(() => {
    if (isRinging) {
      if (isCaller) startOutgoingRingbackSound();
      else startIncomingCallerTuneSound();
    } else {
      stopAllRingtones();
    }
    return () => stopAllRingtones();
  }, [isRinging, isCaller]);

  // WebRTC & Audio Relay Core Engine
  useEffect(() => {
    let localStream: MediaStream | null = null;
    let animFrame: number;
    let mediaRecorder: MediaRecorder | null = null;
    let pollInterval: any = null;

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

    // Handle Remote Track Received via WebRTC
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream(stream);

      if (event.track.kind === "video" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // Send Local ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && (pc as any).signalingState !== "closed") {
        fetch("/api/calls/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ICE_CANDIDATE", candidate: event.candidate })
        }).catch(() => {});
      }
    };

    async function startMedia() {
      try {
        if ((pc as any).signalingState === "closed") return;

        // Request HD Microphone & Camera
        const constraints: MediaStreamConstraints = {
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: session.callType === "video" ? { width: { ideal: 640 }, height: { ideal: 480 } } : false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async () => {
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        });

        if (!stream || (pc as any).signalingState === "closed") return;

        localStream = stream;
        localMediaStreamRef.current = stream;

        // Add Tracks to WebRTC Peer Connection
        stream.getTracks().forEach(track => {
          track.enabled = true;
          if ((pc as any).signalingState !== "closed") {
            try { pc.addTrack(track, stream); } catch (e) {}
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
        }

        // Live Voice Visualizer Analyser
        try {
          const ctx = getOrCreateAudioContext();
          if (ctx) {
            if (ctx.state === "suspended") ctx.resume().catch(() => {});
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVolume = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              setVoiceVolume(Math.min(100, Math.round((sum / dataArray.length / 128) * 100)));
              animFrame = requestAnimationFrame(updateVolume);
            };
            updateVolume();
          }
        } catch (e) {}

        // HTTP Audio Chunk Recorder (800ms full valid WebM/MP4 slices)
        try {
          let mime = "audio/webm";
          if (typeof MediaRecorder !== "undefined") {
            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mime = "audio/webm;codecs=opus";
            else if (MediaRecorder.isTypeSupported("audio/mp4")) mime = "audio/mp4";

            mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
            mediaRecorder.ondataavailable = async (e) => {
              if (e.data && e.data.size > 0) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64 = (reader.result as string)?.split(",")[1];
                  if (base64) {
                    fetch("/api/messages/calls/audio-chunk", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sessionId: session.sessionId, mime, blobBase64: base64 })
                    }).catch(() => {});
                  }
                };
                reader.readAsDataURL(e.data);
              }
            };
            mediaRecorder.start(800);
          }
        } catch (e) {}

        // Caller creates SDP Offer
        if (isCaller && (pc as any).signalingState !== "closed") {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: session.callType === "video" });
          if ((pc as any).signalingState !== "closed") {
            await pc.setLocalDescription(offer);
            fetch("/api/calls/signal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "SDP_OFFER", sdp: offer })
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.error("Start media error:", e);
      }
    }

    startMedia();

    // Web Audio Buffer Decoder Player
    pollInterval = setInterval(async () => {
      if (!isConnected) return;
      try {
        const res = await fetch(`/api/messages/calls/audio-chunk?sessionId=${encodeURIComponent(session.sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.chunks && Array.isArray(data.chunks)) {
            for (const chunk of data.chunks) {
              if (chunk.blobBase64) {
                try {
                  const binaryStr = atob(chunk.blobBase64);
                  const len = binaryStr.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                  }

                  const ctx = getOrCreateAudioContext();
                  if (ctx) {
                    if (ctx.state === "suspended") ctx.resume().catch(() => {});
                    ctx.decodeAudioData(
                      bytes.buffer.slice(0),
                      (audioBuffer) => {
                        const src = ctx.createBufferSource();
                        src.buffer = audioBuffer;

                        const gainNode = ctx.createGain();
                        gainNode.gain.value = isSpeakerOn ? 3.0 : 0.4;

                        src.connect(gainNode);
                        gainNode.connect(ctx.destination);
                        src.start(0);
                        setIsAudioPlaying(true);
                      },
                      () => {}
                    );
                  }
                } catch (e) {}
              }
            }
          }
        }
      } catch (e) {}
    }, 600);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (pollInterval) clearInterval(pollInterval);
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try { mediaRecorder.stop(); } catch (e) {}
      }
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      try { pc.close(); } catch (e) {}
    };
  }, [session.callType, isCaller, isConnected, isSpeakerOn]);

  // Handle Signaling Exchange (Recipient SDP Answer & ICE Candidates)
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc || (pc as any).signalingState === "closed") return;

    async function exchangeSignals() {
      const pc = peerConnectionRef.current;
      if (!pc || (pc as any).signalingState === "closed") return;
      try {
        // Recipient sets SDP Offer & creates SDP Answer
        if (!isCaller && session.status === "CONNECTED" && session.sdpOffer && !pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(session.sdpOffer));
          if ((pc as any).signalingState !== "closed") {
            const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: session.callType === "video" });
            if ((pc as any).signalingState !== "closed") {
              await pc.setLocalDescription(answer);
              fetch("/api/calls/signal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SDP_ANSWER", sdp: answer })
              }).catch(() => {});
            }
          }
        }

        // Caller sets SDP Answer
        if (isCaller && session.sdpAnswer && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(session.sdpAnswer));
        }

        // Exchange ICE Candidates
        const candidates = !isCaller ? session.callerCandidates : session.recipientCandidates;
        if (candidates && candidates.length > 0 && (pc as any).signalingState !== "closed") {
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

    exchangeSignals();
  }, [session.sdpOffer, session.sdpAnswer, session.callerCandidates, session.recipientCandidates, isCaller, session.status]);

  // Call Duration Counter
  useEffect(() => {
    let timer: any;
    if (isConnected) {
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isConnected]);

  // Toggle Mute
  const handleToggleMute = () => {
    unlockAndPlay();
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Toggle Video
  const handleToggleVideo = () => {
    unlockAndPlay();
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getVideoTracks().forEach(t => t.enabled = !isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle Speaker / Earpiece
  const handleToggleSpeaker = () => {
    unlockAndPlay();
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = next ? 1.0 : 0.2;
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      onClick={unlockAndPlay}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        backgroundColor: "rgba(0, 0, 0, 0.94)",
        backdropFilter: "blur(40px)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between", padding: "48px 24px", overflow: "hidden"
      }}
      className="animate-fade-in"
    >
      {/* Native High-Priority Audio Player */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline 
        controls
        style={{
          position: "fixed", bottom: "16px", right: "16px", zIndex: 100000,
          width: "220px", height: "45px", opacity: 0.95,
          background: "#111111", border: "2px solid #00f2fe", borderRadius: "14px",
          boxShadow: "0 0 20px rgba(0,242,254,0.4)"
        }}
      />

      {/* Prominent Tap to Play Overlay if Browser Paused Sound */}
      {!isAudioPlaying && isConnected && (
        <button 
          onClick={unlockAndPlay}
          style={{
            position: "absolute", top: "18px", zIndex: 100001,
            background: "linear-gradient(135deg, #00f2fe, #4facfe)",
            color: "#000000", fontWeight: 900, fontSize: "0.95rem",
            padding: "12px 28px", borderRadius: "9999px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "10px",
            boxShadow: "0 0 35px rgba(0, 242, 254, 0.9)", border: "none"
          }}
          className="animate-bounce"
        >
          <Play size={20} fill="#000" /> 🎙️🔊 TAP HERE TO START HEARING VOICE SOUND!
        </button>
      )}

      {/* Background Artwork */}
      <div 
        style={{
          position: "absolute", inset: 0, backgroundImage: `url(${otherPersonAvatar})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(70px) brightness(0.2)", opacity: 0.6, transform: "scale(1.1)", zIndex: 0
        }} 
      />

      {/* Top Bar Header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 2 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255, 255, 255, 0.12)", padding: "6px 18px",
          borderRadius: "9999px", color: "white", fontSize: "0.85rem", fontWeight: 800,
          border: "1px solid rgba(255, 255, 255, 0.2)", backdropFilter: "blur(12px)"
        }}>
          <Shield size={16} style={{ color: "#10b981" }} /> End-to-End Encrypted HD Voice Call
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

      {/* Avatar Visualizer */}
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
        {/* Recipient Ringing Controls */}
        {isRecipient && isRinging ? (
          <>
            <button
              onClick={() => {
                unlockAndPlay();
                onAcceptCall();
              }}
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

            {/* Speaker Toggle */}
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

            {/* Video Toggle */}
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

            {/* End Call */}
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
