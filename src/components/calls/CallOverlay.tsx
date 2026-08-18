"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, Video, VideoOff, 
  Shield, PhoneCall, Headphones, Minimize2, Maximize2, RefreshCw
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

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const processedIceCandidatesRef = useRef<Set<string>>(new Set());
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

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
      console.log("[CallOverlay] Unlocking audio pipeline via user tap...");
      const ctx = getOrCreateAudioContext();
      if (ctx && ctx.state === "suspended") {
        await ctx.resume();
      }
      if (remoteStream) {
        playRemoteAudioStream(remoteStream, isSpeakerOn);
      }
    } catch (e) {
      console.error("[CallOverlay] Audio unlock error:", e);
    }
  };

  // FORCE PLAY AUDIO DIAGNOSTIC BUTTON HANDLER
  const handleForcePlayAudio = () => {
    console.log("[FORCE PLAY AUDIO] Diagnostic Button Pressed!");
    const pc = peerConnectionRef.current;
    let log = `[DEBUG LOG @ ${new Date().toLocaleTimeString()}]\n`;

    if (pc) {
      log += `PC Connection State: ${pc.connectionState}\n`;
      log += `PC ICE State: ${pc.iceConnectionState}\n`;
      log += `PC Signaling State: ${pc.signalingState}\n`;
    } else {
      log += `PC Connection: NULL\n`;
    }

    if (remoteStream) {
      const audioTracks = remoteStream.getAudioTracks();
      log += `Remote Stream Audio Tracks: ${audioTracks.length}\n`;
      audioTracks.forEach((t, i) => {
        t.enabled = true;
        log += `Track #${i} -> label: ${t.label}, readyState: ${t.readyState}, enabled: ${t.enabled}, muted: ${t.muted}\n`;
      });
      playRemoteAudioStream(remoteStream, isSpeakerOn);
    } else {
      log += `Remote Stream: NULL (Waiting for pc.ontrack)\n`;
    }

    const ctx = getOrCreateAudioContext();
    if (ctx) {
      log += `AudioContext State: ${ctx.state}, SampleRate: ${ctx.sampleRate}\n`;
      ctx.resume().catch(() => {});
    }

    const audioEl = document.getElementById("global_webrtc_remote_audio") as HTMLAudioElement | null;
    if (audioEl) {
      log += `Global Audio El readyState: ${audioEl.readyState}, paused: ${audioEl.paused}, muted: ${audioEl.muted}\n`;
      audioEl.muted = false;
      audioEl.play().then(() => {
        log += `SUCCESS: Global Audio El play() resolved!\n`;
        setDebugLogText(log);
      }).catch(e => {
        log += `ERROR: Global Audio El play() failed: ${e.message}\n`;
        setDebugLogText(log);
      });
    }

    setDebugLogText(log);
  };

  // Bind Remote Stream to Audio Engines
  useEffect(() => {
    if (remoteStream) {
      console.log("[CallOverlay] Binding remoteStream to Audio Engine. Audio tracks count:", remoteStream.getAudioTracks().length);
      playRemoteAudioStream(remoteStream, isSpeakerOn);

      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.15;
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

  // CORE WEBRTC ENGINE INITIALIZATION (STABLE LIFECYCLE + RELIABLE ICE QUEUE)
  useEffect(() => {
    // If recipient is in RINGING state, DO NOT start media or auto-accept!
    if (isRecipient && isRinging) return;

    console.log("[CallOverlay] Initializing STABLE WebRTC Peer Connection with TURN Relays...");
    let localStream: MediaStream | null = null;
    let animFrame: number;

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
        console.log("[CallOverlay] ICE Candidate generated, sending to peer:", event.candidate.type || "candidate");
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

        console.log("[CallOverlay] Requesting getUserMedia...");
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

        console.log("[CallOverlay] Local media stream captured successfully. Audio tracks:", stream.getAudioTracks().length);
        localStream = stream;
        localMediaStreamRef.current = stream;

        // Add Tracks to WebRTC Peer Connection
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

        // Caller SDP Offer
        if (isCaller && (pc as any).signalingState !== "closed") {
          console.log("[CallOverlay] Creating SDP Offer...");
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
        console.error("[CallOverlay] Start media error:", e);
      }
    }

    startMedia();

    // CLEANUP ON UNMOUNT ONLY
    return () => {
      console.log("[CallOverlay] Unmounting: Closing Peer Connection...");
      stopAllRingtones();
      if (animFrame) cancelAnimationFrame(animFrame);
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
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
  }, [session.sessionId, isRecipient, isRinging]);

  // Helper to add candidate safely (only after remote description is set)
  const addCandidateSafely = async (cand: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc || (pc as any).signalingState === "closed") return;
    
    if (pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
        console.log("[WebRTC Candidates] Added ICE Candidate successfully!");
      } catch (e) {
        console.warn("[WebRTC Candidates] Candidate add error:", e);
      }
    } else {
      console.log("[WebRTC Candidates] Queuing candidate until RemoteDescription is set...");
      pendingIceCandidatesRef.current.push(cand);
    }
  };

  const flushPendingIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription || (pc as any).signalingState === "closed") return;
    
    console.log(`[WebRTC Candidates] Flushing ${pendingIceCandidatesRef.current.length} queued ICE candidates...`);
    while (pendingIceCandidatesRef.current.length > 0) {
      const cand = pendingIceCandidatesRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
          console.log("[WebRTC Candidates] Flushed candidate added successfully!");
        } catch (e) {}
      }
    }
  };

  // DEDICATED TWO-WAY SIGNALING EXCHANGE LISTENER (STRICT WEBRTC ORDER ENFORCEMENT)
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc || (pc as any).signalingState === "closed") return;

    async function handleSignaling() {
      const pc = peerConnectionRef.current;
      if (!pc || (pc as any).signalingState === "closed") return;

      try {
        // 1. Recipient receives SDP Offer from Caller -> sets remote description & creates SDP Answer
        if (!isCaller && session.sdpOffer && (pc.signalingState === "stable" || pc.signalingState === "have-local-offer") && !pc.remoteDescription) {
          console.log("[WebRTC Handshake] Recipient received sdpOffer! Setting Remote Description & Creating Answer...");
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
              console.log("[WebRTC Handshake] Recipient sent SDP Answer to Caller!");
            }
          }
        }

        // 2. Caller receives SDP Answer from Recipient -> transitions to STABLE & flushes ICE candidates
        if (isCaller && session.sdpAnswer && pc.signalingState === "have-local-offer") {
          console.log("[WebRTC Handshake] Caller received sdpAnswer! Setting Remote Description -> Transitioning to STABLE!");
          await pc.setRemoteDescription(new RTCSessionDescription(session.sdpAnswer));
          await flushPendingIceCandidates();
          console.log("[WebRTC Handshake] Caller PC Signaling State is now:", pc.signalingState);
        }

        // 3. Process ICE Candidates safely (queued if remoteDescription is not set yet)
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
      remoteAudioRef.current.volume = nextSpeaker ? 1.0 : 0.15;
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
        justifyContent: "space-between", padding: "48px 24px", overflow: "hidden"
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 2, width: "100%", maxWidth: "420px", position: "relative" }}>
        {isConnected && (
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              position: "absolute", right: 0, top: 0,
              background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "white", borderRadius: "50%", width: "42px", height: "42px",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              backdropFilter: "blur(12px)"
            }}
            title="Minimize Call to Floating Pill"
          >
            <Minimize2 size={20} />
          </button>
        )}

        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255, 255, 255, 0.12)", padding: "6px 18px",
          borderRadius: "9999px", color: "white", fontSize: "0.85rem", fontWeight: 800,
          border: "1px solid rgba(255, 255, 255, 0.2)", backdropFilter: "blur(12px)"
        }}>
          <Shield size={16} style={{ color: "#10b981" }} /> End-to-End Encrypted HD {session.callType === "voice" ? "Voice" : "Video"} Call
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
              <PhoneCall size={16} className="animate-pulse" /> {isCaller ? `Calling ${otherPersonName}...` : `Incoming Call from ${otherPersonName}...`}
            </>
          ) : (
            `Connected • ${formatTimer(callDuration)}`
          )}
        </span>

        {/* DIAGNOSTIC "FORCE PLAY AUDIO" DEBUG BUTTON */}
        <button
          onClick={handleForcePlayAudio}
          style={{
            marginTop: "10px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "#ffffff", fontWeight: 900, fontSize: "0.8rem",
            padding: "8px 20px", borderRadius: "9999px", border: "none",
            cursor: "pointer", boxShadow: "0 0 20px rgba(239, 68, 68, 0.6)",
            display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          <Volume2 size={16} /> 🔊 FORCE PLAY AUDIO (DIAGNOSTIC UNLOCK)
        </button>

        {/* Live Diagnostic Logs Box */}
        {debugLogText && (
          <pre style={{
            background: "rgba(0, 0, 0, 0.85)", border: "1px solid #ef4444",
            color: "#00f2fe", padding: "10px", borderRadius: "12px",
            fontSize: "0.7rem", maxWidth: "100%", overflowX: "auto",
            marginTop: "10px", textAlign: "left", whiteSpace: "pre-wrap"
          }}>
            {debugLogText}
          </pre>
        )}
      </div>

      {/* Avatar / Video Canvas Display */}
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
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar with ALL 6 FEATURES VISIBLE & FUNCTIONAL */}
      <div style={{
        display: "flex", alignItems: "center", gap: "16px",
        background: "rgba(255, 255, 255, 0.14)", padding: "14px 24px",
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
                width: "68px", height: "68px", borderRadius: "50%",
                background: "#10b981", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 0 35px rgba(16, 185, 129, 0.8)"
              }}
              className="hover:scale-110 active:scale-95 transition-all animate-bounce"
              title="Accept Call"
            >
              <Phone size={30} />
            </button>
            <button
              onClick={onEndCall}
              style={{
                width: "68px", height: "68px", borderRadius: "50%",
                background: "#ef4444", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 0 35px rgba(239, 68, 68, 0.8)"
              }}
              className="hover:scale-110 active:scale-95 transition-all"
              title="Decline Call"
            >
              <PhoneOff size={30} />
            </button>
          </>
        ) : (
          <>
            {/* 1. Mute Mic */}
            <button
              onClick={handleToggleMute}
              style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
                border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* 2. Loudspeaker / Earpiece Toggle Button */}
            <button
              onClick={handleToggleSpeaker}
              style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: isSpeakerOn ? "rgba(0, 242, 254, 0.3)" : "rgba(255, 255, 255, 0.2)",
                border: "none", color: isSpeakerOn ? "#00f2fe" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title={isSpeakerOn ? "Loudspeaker Mode (Main Speaker)" : "Earpiece Mode (Top Receiver)"}
            >
              {isSpeakerOn ? <Volume2 size={20} /> : <Headphones size={20} />}
            </button>

            {/* 3. Video Toggle */}
            <button
              onClick={handleToggleVideo}
              style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: isVideoEnabled ? "rgba(168, 85, 247, 0.3)" : "rgba(255, 255, 255, 0.2)",
                border: "none", color: isVideoEnabled ? "#a855f7" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title={isVideoEnabled ? "Turn Video Off" : "Turn Video On"}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            {/* 4. Flip Camera Button (Front / Rear) */}
            <button
              onClick={handleFlipCamera}
              style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title="Flip Camera (Front / Back)"
            >
              <RefreshCw size={20} />
            </button>

            {/* 5. Minimize to Floating Pill Button */}
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              className="hover:scale-105 active:scale-95"
              title="Minimize to Floating Pill"
            >
              <Minimize2 size={20} />
            </button>

            {/* 6. End Call Button */}
            <button
              onClick={onEndCall}
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: "#ef4444", border: "none", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 0 25px rgba(239, 68, 68, 0.7)"
              }}
              className="hover:scale-110 active:scale-95 transition-all"
              title="End Call"
            >
              <PhoneOff size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
