"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, Video, VideoOff, 
  Shield, PhoneCall, Headphones, Minimize2, Maximize2, RefreshCw, Zap
} from "lucide-react";
import { 
  CallSessionData, startOutgoingRingbackSound, 
  startIncomingCallerTuneSound, stopAllRingtones, getOrCreateAudioContext,
  claimSystemAudioSession, releaseSystemAudioSession, playRemoteAudioStream
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
  const [isVideoEnabled, setIsVideoEnabled] = useState(session.callType === "video");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [debugLogText, setDebugLogText] = useState<string>("");

  // Live Detailed Diagnostic State
  const [diag, setDiag] = useState({
    localTracks: "0 (none)",
    remoteTracks: "0 (none)",
    audioEl: "none",
    audioCtx: "none",
    pcState: "NONE",
    iceState: "NONE",
    sigState: "NONE",
    lastMsg: "Initializing real-time monitor..."
  });

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const processedIceCandidatesRef = useRef<Set<string>>(new Set());
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isMediaCapturedRef = useRef<boolean>(false);

  // Clean Partner Name & Avatar Resolution
  const rawOtherName = isCaller ? (session.recipientName || session.recipientId) : (session.callerName || session.callerId);
  const otherPersonName = (rawOtherName && rawOtherName !== "me" && rawOtherName !== "User") ? rawOtherName : "Friend";
  const rawOtherAvatar = isCaller ? session.recipientAvatar : session.callerAvatar;
  const otherPersonAvatar = rawOtherAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherPersonName)}&background=00f2fe&color=ffffff`;

  // Claim System Audio Session
  useEffect(() => {
    claimSystemAudioSession(otherPersonName, session.callType);
    return () => {
      releaseSystemAudioSession();
    };
  }, [otherPersonName, session.callType]);

  // Audio Context Gesture Unlock Helper
  const unlockAudioPipeline = async () => {
    try {
      const ctx = getOrCreateAudioContext();
      if (ctx && ctx.state === "suspended") {
        await ctx.resume();
      }
      if (remoteStream) {
        playRemoteAudioStream(remoteStream, isSpeakerOn);
      }
    } catch (e) {}
  };

  // 1. BUTTON ACTION: FORCE PLAY REMOTE AUDIO
  const handleForcePlayAudio = () => {
    console.log("[FORCE PLAY AUDIO] Diagnostic Button Tapped!");
    unlockAudioPipeline();

    const pc = peerConnectionRef.current;
    if (remoteStream) {
      remoteStream.getAudioTracks().forEach(t => t.enabled = true);
      playRemoteAudioStream(remoteStream, isSpeakerOn);
    }

    if (pc) {
      pc.getReceivers().forEach(rcv => {
        if (rcv.track && rcv.track.kind === "audio") {
          rcv.track.enabled = true;
          const s = new MediaStream([rcv.track]);
          playRemoteAudioStream(s, isSpeakerOn);
        }
      });
    }

    const audioEl = (remoteAudioRef.current || document.getElementById("global_webrtc_remote_audio")) as HTMLAudioElement | null;
    if (audioEl) {
      audioEl.muted = false;
      audioEl.volume = isSpeakerOn ? 1.0 : 0.2;
      audioEl.play().catch(() => {});
    }
  };

  // 2. BUTTON ACTION: FORCE ENABLE ALL TRACKS
  const handleForceEnableAllTracks = () => {
    console.log("[FORCE ENABLE ALL TRACKS] Diagnostic Button Tapped!");
    unlockAudioPipeline();

    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = true;
        console.log("[Local Track Forced Enabled]:", t.label);
      });
    }

    if (remoteStream) {
      remoteStream.getAudioTracks().forEach(t => {
        t.enabled = true;
        console.log("[Remote Track Forced Enabled]:", t.label);
      });
    }

    const pc = peerConnectionRef.current;
    if (pc) {
      pc.getSenders().forEach(snd => {
        if (snd.track && snd.track.kind === "audio") {
          snd.track.enabled = true;
        }
      });
      pc.getReceivers().forEach(rcv => {
        if (rcv.track && rcv.track.kind === "audio") {
          rcv.track.enabled = true;
        }
      });
    }
    setIsMuted(false);
  };

  // Real-time Live Diagnostic Telemetry Monitor (Updates every 500ms)
  useEffect(() => {
    const monitor = setInterval(() => {
      const pc = peerConnectionRef.current;
      const pcState = pc ? pc.connectionState : "NULL";
      const iceState = pc ? pc.iceConnectionState : "NULL";
      const sigState = pc ? pc.signalingState : "NULL";

      // Local tracks info
      let locInfo = "0 (none)";
      if (localMediaStreamRef.current) {
        const trks = localMediaStreamRef.current.getAudioTracks();
        if (trks.length > 0) {
          locInfo = trks.map(t => `${t.kind}: en=${t.enabled}, mut=${t.muted}, state=${t.readyState}`).join(" | ");
        }
      }

      // Remote tracks info
      let remInfo = "0 (waiting)";
      if (remoteStream) {
        const trks = remoteStream.getAudioTracks();
        if (trks.length > 0) {
          remInfo = trks.map(t => `${t.kind}: en=${t.enabled}, mut=${t.muted}, state=${t.readyState}`).join(" | ");
        }
      } else if (pc) {
        const receivers = pc.getReceivers().filter(r => r.track && r.track.kind === "audio");
        if (receivers.length > 0) {
          remInfo = receivers.map(r => `rcv: en=${r.track.enabled}, mut=${r.track.muted}, state=${r.track.readyState}`).join(" | ");
        }
      }

      // Audio DOM Element info
      const audioEl = (remoteAudioRef.current || document.getElementById("global_webrtc_remote_audio")) as HTMLAudioElement | null;
      let elInfo = "none";
      if (audioEl) {
        elInfo = `pause=${audioEl.paused}, vol=${audioEl.volume}, ready=${audioEl.readyState}, mut=${audioEl.muted}`;
      }

      // AudioContext info
      const ctx = getOrCreateAudioContext();
      let ctxInfo = "none";
      if (ctx) {
        ctxInfo = `state=${ctx.state}, rate=${ctx.sampleRate}`;
      }

      setDiag({
        localTracks: locInfo,
        remoteTracks: remInfo,
        audioEl: elInfo,
        audioCtx: ctxInfo,
        pcState,
        iceState,
        sigState,
        lastMsg: isConnected ? "Call Connected & Live" : "Signaling Handshake in Progress"
      });
    }, 500);

    return () => clearInterval(monitor);
  }, [remoteStream, isConnected]);

  // Bind Remote Stream to Audio Engines
  useEffect(() => {
    if (remoteStream) {
      console.log("[CallOverlay] Binding remoteStream to Audio Engine. Audio tracks count:", remoteStream.getAudioTracks().length);
      playRemoteAudioStream(remoteStream, isSpeakerOn);

      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.2;
        remoteAudioRef.current.play().catch(e => console.warn("[CallOverlay] Local audio element play error:", e));
      }
    }
  }, [remoteStream, isSpeakerOn]);

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

  // Helper to add candidate safely (only after remote description is set)
  const addCandidateSafely = async (cand: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc || (pc as any).signalingState === "closed") return;
    
    if (pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {}
    } else {
      pendingIceCandidatesRef.current.push(cand);
    }
  };

  const flushPendingIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription || (pc as any).signalingState === "closed") return;
    
    while (pendingIceCandidatesRef.current.length > 0) {
      const cand = pendingIceCandidatesRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {}
      }
    }
  };

  // INITIALIZE WEBRTC PEER CONNECTION (SINGLETON LIFECYCLE FOR COMPONENT LIFETIME)
  useEffect(() => {
    console.log("[CallOverlay] Mounting Singleton WebRTC PeerConnection...");

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
      ],
      iceCandidatePoolSize: 10
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC State] pc.connectionState changed to:", pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC State] pc.iceConnectionState changed to:", pc.iceConnectionState);
    };

    // Handle Remote Track Received via WebRTC
    pc.ontrack = (event) => {
      console.log("[CallOverlay] pc.ontrack event received! Track kind:", event.track.kind, "Streams count:", event.streams.length);
      const stream = event.streams[0] || new MediaStream([event.track]);
      event.track.enabled = true;
      setRemoteStream(stream);

      playRemoteAudioStream(stream, isSpeakerOn);

      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== stream) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.play().catch(() => {});
      }

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

    // UNMOUNT-ONLY CLEANUP (RUNS ONLY WHEN CALL IS COMPLETELY CLOSED/REMOVED!)
    return () => {
      console.log("[CallOverlay] Unmounting CallOverlay component: Closing Peer Connection permanently...");
      stopAllRingtones();
      if (localMediaStreamRef.current) {
        localMediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      try { pc.close(); } catch (e) {}
    };
  }, []);

  // MEDIA CAPTURE ENGINE (CAPTURES MICROPHONE AND ADDS TRACKS TO PC)
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc || (pc as any).signalingState === "closed") return;
    if (isRecipient && isRinging) return;
    if (isMediaCapturedRef.current) return;

    isMediaCapturedRef.current = true;
    console.log("[CallOverlay] Capturing Local Media Stream...");

    let animFrame: number;

    async function captureMedia() {
      const pc = peerConnectionRef.current;
      if (!pc || (pc as any).signalingState === "closed") return;

      try {
        const constraints: MediaStreamConstraints = {
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 },
          video: session.callType === "video" ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: facingMode
          } : false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async () => {
          console.warn("[CallOverlay] Video constraint failed, falling back to audio only");
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        });

        if (!stream || (pc as any).signalingState === "closed") return;

        localMediaStreamRef.current = stream;

        stream.getTracks().forEach(track => {
          track.enabled = true;
          if ((pc as any).signalingState !== "closed") {
            try { 
              pc.addTrack(track, stream); 
              console.log("[CallOverlay] Added local track to PC:", track.kind);
            } catch (e) {}
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

        // CALLER: Create SDP Offer immediately after adding local tracks
        if (isCaller && (pc as any).signalingState !== "closed") {
          console.log("[CallOverlay] Caller creating SDP Offer after tracks attached...");
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: session.callType === "video" });
          await pc.setLocalDescription(offer);
          await fetch("/api/calls/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "SDP_OFFER", sdp: offer })
          });
          console.log("[CallOverlay] SDP Offer sent successfully!");
        }
      } catch (e) {
        console.error("[CallOverlay] Media capture error:", e);
      }
    }

    captureMedia();
  }, [isRecipient, isRinging, isCaller, session.callType]);

  // DECOUPLED REACTIVE SIGNALING LISTENER (HANDLES sdpOffer AND sdpAnswer REACTION INSTANTLY)
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc || (pc as any).signalingState === "closed") return;

    async function handleSignaling() {
      const pc = peerConnectionRef.current;
      if (!pc || (pc as any).signalingState === "closed") return;

      try {
        // RECIPIENT: When sdpOffer is present AND remoteDescription is not set yet
        if (!isCaller && session.sdpOffer && !pc.remoteDescription && pc.signalingState !== "closed") {
          console.log("[WebRTC Handshake] Recipient processing sdpOffer! Setting Remote Description & Creating Answer...");
          await pc.setRemoteDescription(new RTCSessionDescription(session.sdpOffer));
          await flushPendingIceCandidates();

          if ((pc as any).signalingState !== "closed") {
            const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: session.callType === "video" });
            if ((pc as any).signalingState !== "closed") {
              await pc.setLocalDescription(answer);
              await fetch("/api/calls/signal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SDP_ANSWER", sdp: answer })
              });
              console.log("[WebRTC Handshake] Recipient sent SDP Answer to server!");
            }
          }
        }

        // CALLER: When sdpAnswer is present AND remoteDescription is not set yet
        if (isCaller && session.sdpAnswer && !pc.remoteDescription && pc.signalingState !== "closed") {
          console.log("[WebRTC Handshake] Caller processing sdpAnswer! Setting Remote Description -> Transitioning to STABLE!");
          await pc.setRemoteDescription(new RTCSessionDescription(session.sdpAnswer));
          await flushPendingIceCandidates();
          console.log("[WebRTC Handshake] SUCCESS: Caller PC Signaling State is now:", pc.signalingState);
        }

        // ICE Candidates Process
        const candidates = !isCaller ? session.callerCandidates : session.recipientCandidates;
        if (candidates && candidates.length > 0 && (pc as any).signalingState !== "closed") {
          for (const cand of candidates) {
            const candStr = JSON.stringify(cand);
            if (!processedIceCandidatesRef.current.has(candStr)) {
              processedIceCandidatesRef.current.add(candStr);
              await addCandidateSafely(cand);
            }
          }
        }
      } catch (e) {
        console.error("[WebRTC Handshake] Error handling signaling:", e);
      }
    }

    handleSignaling();
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
    unlockAudioPipeline();
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Toggle Video
  const handleToggleVideo = () => {
    unlockAudioPipeline();
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getVideoTracks().forEach(t => t.enabled = !isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Switch Front / Rear Camera
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Toggle Speaker / Earpiece Target Output
  const handleToggleSpeaker = () => {
    unlockAudioPipeline();
    const nextSpeaker = !isSpeakerOn;
    setIsSpeakerOn(nextSpeaker);
    if (remoteStream) {
      playRemoteAudioStream(remoteStream, nextSpeaker);
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = nextSpeaker ? 1.0 : 0.2;
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Minimized Picture-in-Picture Floating Bar
  if (isMinimized) {
    return (
      <div 
        style={{
          position: "fixed", top: "16px", right: "16px", zIndex: 99999,
          background: "rgba(10, 10, 12, 0.95)", border: "2px solid #00f2fe",
          borderRadius: "9999px", padding: "8px 20px", display: "flex",
          alignItems: "center", gap: "12px", boxShadow: "0 10px 30px rgba(0, 242, 254, 0.4)",
          backdropFilter: "blur(16px)", cursor: "pointer", color: "white"
        }}
        onClick={() => setIsMinimized(false)}
        className="animate-pulse"
      >
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ width: 0, height: 0, opacity: 0 }} />
        <img
          src={otherPersonAvatar}
          alt={otherPersonName}
          style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "2px solid #00f2fe" }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffffff" }}>{otherPersonName}</span>
          <span style={{ fontSize: "0.75rem", color: "#00f2fe", fontWeight: 700 }}>
            {isConnected ? `Connected • ${formatTimer(callDuration)}` : "Calling..."}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
          }}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEndCall();
          }}
          style={{ background: "#ef4444", border: "none", color: "white", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <PhoneOff size={16} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={unlockAudioPipeline}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        backgroundColor: "rgba(8, 8, 12, 0.96)",
        backdropFilter: "blur(40px)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between", padding: "24px 16px", overflowY: "auto"
      }}
      className="animate-fade-in"
    >
      {/* Hidden Native Audio Element */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline 
        style={{
          position: "fixed", bottom: 0, right: 0,
          width: "1px", height: "1px", opacity: 0.001,
          pointerEvents: "none"
        }}
      />

      {/* Background Artwork */}
      <div 
        style={{
          position: "absolute", inset: 0, backgroundImage: `url(${otherPersonAvatar})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(80px) brightness(0.18)", opacity: 0.5, transform: "scale(1.1)", zIndex: 0
        }} 
      />

      {/* Top Bar Header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", zIndex: 2, width: "100%", maxWidth: "460px", position: "relative" }}>
        {isConnected && (
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              position: "absolute", right: 0, top: 0,
              background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "white", borderRadius: "50%", width: "38px", height: "38px",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              backdropFilter: "blur(12px)"
            }}
            title="Minimize Call to Floating Pill"
          >
            <Minimize2 size={18} />
          </button>
        )}

        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255, 255, 255, 0.12)", padding: "4px 14px",
          borderRadius: "9999px", color: "white", fontSize: "0.8rem", fontWeight: 800,
          border: "1px solid rgba(255, 255, 255, 0.2)", backdropFilter: "blur(12px)"
        }}>
          <Shield size={14} style={{ color: "#10b981" }} /> End-to-End Encrypted HD {session.callType === "voice" ? "Voice" : "Video"} Call
        </div>

        <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#ffffff", margin: "6px 0 2px 0", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
          {otherPersonName}
        </h2>
        
        <span style={{ 
          fontSize: "0.95rem", 
          color: isConnected ? "#10b981" : "#00f2fe", 
          fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" 
        }}>
          {isRinging ? (
            <>
              <PhoneCall size={16} className="animate-pulse" /> {isCaller ? `Calling ${otherPersonName}...` : `Incoming Call from ${otherPersonName}...`}
            </>
          ) : (
            `Connected • ${formatTimer(callDuration)}`
          )}
        </span>

        {/* 🚨 AGGRESSIVE MANDATORY REAL-TIME DEBUG PANEL 🚨 */}
        <div style={{
          width: "100%", background: "rgba(239, 68, 68, 0.18)",
          border: "2px solid #ef4444", borderRadius: "16px",
          padding: "10px 14px", marginTop: "8px", backdropFilter: "blur(16px)",
          boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)", textAlign: "left"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "#ef4444", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.5px" }}>
              🔴 LIVE AGGRESSIVE WEBRTC AUDIO TELEMETRY
            </span>
            <span style={{ color: "#00f2fe", fontSize: "0.7rem", fontWeight: 700 }}>
              {diag.lastMsg}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.7rem", fontFamily: "monospace", color: "#ffffff" }}>
            <div><span style={{ color: "#00f2fe" }}>PC Conn:</span> {diag.pcState}</div>
            <div><span style={{ color: "#00f2fe" }}>ICE State:</span> {diag.iceState}</div>
            <div><span style={{ color: "#00f2fe" }}>Signaling:</span> {diag.sigState}</div>
            <div><span style={{ color: "#00f2fe" }}>AudioCtx:</span> {diag.audioCtx}</div>
            <div style={{ gridColumn: "span 2" }}><span style={{ color: "#10b981" }}>Local Audio:</span> {diag.localTracks}</div>
            <div style={{ gridColumn: "span 2" }}><span style={{ color: "#f59e0b" }}>Remote Audio:</span> {diag.remoteTracks}</div>
            <div style={{ gridColumn: "span 2" }}><span style={{ color: "#ec4899" }}>Audio Element:</span> {diag.audioEl}</div>
          </div>

          {/* TWO MANDATORY BIG FORCE BUTTONS */}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={handleForcePlayAudio}
              style={{
                flex: 1, background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "white", fontWeight: 900, fontSize: "0.7rem",
                padding: "8px 10px", borderRadius: "10px", border: "none",
                cursor: "pointer", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"
              }}
            >
              <Volume2 size={14} /> 🔊 FORCE PLAY REMOTE AUDIO
            </button>
            <button
              onClick={handleForceEnableAllTracks}
              style={{
                flex: 1, background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "white", fontWeight: 900, fontSize: "0.7rem",
                padding: "8px 10px", borderRadius: "10px", border: "none",
                cursor: "pointer", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"
              }}
            >
              <Zap size={14} /> ⚡ FORCE ENABLE ALL TRACKS
            </button>
          </div>
        </div>
      </div>

      {/* Avatar / Video Canvas Display */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", width: "100%", maxHeight: "380px", flex: 1, zIndex: 2, margin: "12px 0" }}>
        {session.callType === "voice" ? (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              position: "absolute", width: `${150 + voiceVolume * 1.2}px`, height: `${150 + voiceVolume * 1.2}px`,
              borderRadius: "50%", border: "3px solid rgba(0, 242, 254, 0.7)", boxShadow: "0 0 30px rgba(0, 242, 254, 0.4)",
              transition: "all 0.08s ease-out", opacity: isMuted ? 0.2 : 0.8
            }} />
            <img
              src={otherPersonAvatar}
              alt={otherPersonName}
              style={{
                width: "130px", height: "130px", borderRadius: "50%", objectFit: "cover",
                border: "4px solid #00f2fe", boxShadow: "0 0 40px rgba(0, 242, 254, 0.5)", zIndex: 2
              }}
            />
          </div>
        ) : (
          <div style={{
            width: "100%", maxWidth: "640px", height: "100%", minHeight: "280px",
            borderRadius: "24px", overflow: "hidden", background: "#111111", position: "relative",
            border: "1px solid rgba(255, 255, 255, 0.2)", boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
          }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{
              position: "absolute", bottom: "16px", right: "16px", width: "100px", height: "140px",
              borderRadius: "16px", background: "#000", border: "2px solid rgba(255, 255, 255, 0.4)", overflow: "hidden"
            }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar with ALL 6 FEATURES VISIBLE & FUNCTIONAL */}
      <div style={{
        display: "flex", alignItems: "center", gap: "14px",
        background: "rgba(255, 255, 255, 0.14)", padding: "12px 20px",
        borderRadius: "9999px", border: "1px solid rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(24px)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 2
      }}>
        {/* Recipient Ringing Controls (MANUAL TAP TO ACCEPT REQUIRED) */}
        {isRecipient && isRinging ? (
          <>
            <button
              onClick={() => {
                unlockAudioPipeline();
                onAcceptCall();
              }}
              style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "#10b981", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 0 35px rgba(16, 185, 129, 0.8)"
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
                cursor: "pointer", boxShadow: "0 0 35px rgba(239, 68, 68, 0.8)"
              }}
              className="hover:scale-110 active:scale-95 transition-all"
              title="Decline Call"
            >
              <PhoneOff size={28} />
            </button>
          </>
        ) : (
          <>
            {/* 1. Mute Mic */}
            <button
              onClick={handleToggleMute}
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
                border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* 2. Loudspeaker / Earpiece Toggle Button */}
            <button
              onClick={handleToggleSpeaker}
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: isSpeakerOn ? "rgba(0, 242, 254, 0.3)" : "rgba(255, 255, 255, 0.2)",
                border: "none", color: isSpeakerOn ? "#00f2fe" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title={isSpeakerOn ? "Loudspeaker Mode (Main Speaker)" : "Earpiece Mode (Top Receiver)"}
            >
              {isSpeakerOn ? <Volume2 size={18} /> : <Headphones size={18} />}
            </button>

            {/* 3. Video Toggle */}
            <button
              onClick={handleToggleVideo}
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: isVideoEnabled ? "rgba(168, 85, 247, 0.3)" : "rgba(255, 255, 255, 0.2)",
                border: "none", color: isVideoEnabled ? "#a855f7" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title={isVideoEnabled ? "Turn Video Off" : "Turn Video On"}
            >
              {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            {/* 4. Flip Camera Button (Front / Rear) */}
            <button
              onClick={handleFlipCamera}
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title="Flip Camera (Front / Back)"
            >
              <RefreshCw size={18} />
            </button>

            {/* 5. Minimize to Floating Pill Button */}
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title="Minimize to Floating Pill"
            >
              <Minimize2 size={18} />
            </button>

            {/* 6. End Call Button */}
            <button
              onClick={onEndCall}
              style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: "#ef4444", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 0 25px rgba(239, 68, 68, 0.7)"
              }}
              className="hover:scale-110 active:scale-95 transition-all"
              title="End Call"
            >
              <PhoneOff size={22} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
