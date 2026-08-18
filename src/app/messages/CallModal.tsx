"use client";

import { useState, useEffect, useRef } from "react";
import { 
  PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, 
  Shield, PhoneCall, MicOff as MicMutedIcon, Smartphone, Headphones
} from "lucide-react";

interface CallModalProps {
  type: "voice" | "video";
  contact: {
    id?: string;
    name: string;
    avatar: string;
    username: string;
  };
  onEndCall: () => void;
  isIncomingAccepted?: boolean;
}

export function CallModal({ type, contact, onEndCall, isIncomingAccepted = false }: CallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isEarpieceMode, setIsEarpieceMode] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isNearEarMode, setIsNearEarMode] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [callState, setCallState] = useState<"ringing" | "connected" | "declined">(
    isIncomingAccepted ? "connected" : "ringing"
  );
  
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const callInitTimeRef = useRef<number>(Date.now());
  const processedIceCandidatesRef = useRef<Set<string>>(new Set());

  // Initialize WebRTC Peer Connection & Media Streams
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

    // Handle Remote Track Received (WebRTC Voice & Video Stream Arrives from Remote Peer!)
    pc.ontrack = (event) => {
      console.log("WebRTC Remote Track Received:", event.track.kind, event.streams);
      const remoteStream = event.streams[0] || new MediaStream([event.track]);

      if (event.track.kind === "video" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.3;
        remoteAudioRef.current.play().catch(e => console.log("Remote audio play error:", e));
      }
    };

    // Handle Local ICE Candidates Generated
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        fetch("/api/messages/calls/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ICE_CANDIDATE", candidate: event.candidate })
        }).catch(() => {});
      }
    };

    async function initMediaCall() {
      try {
        if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === "video",
          audio: true
        }).catch(async () => {
          return await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        });

        if (!stream) return;

        activeStream = stream;
        localMediaStreamRef.current = stream;

        // Add local tracks to WebRTC Peer Connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Bind local video feed for self-view
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Set up Web Audio Analyser for live mic spectrum visualizer
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVolume = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              setVoiceVolume(Math.min(100, Math.round((average / 128) * 100)));
              animFrame = requestAnimationFrame(updateVolume);
            };
            updateVolume();
          }
        } catch (err) {}

        // If caller: Create WebRTC SDP Offer
        const targetId = contact.id || contact.username;
        if (!isIncomingAccepted && targetId) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          fetch("/api/messages/calls/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "OFFER",
              toUserId: targetId,
              callType: type,
              callerName: contact.name,
              callerAvatar: contact.avatar,
              sdp: offer
            })
          }).catch(err => console.error("Send call offer error:", err));
        }
      } catch (err) {
        console.error("Camera/Mic access error:", err);
      }
    }

    initMediaCall();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      pc.close();
    };
  }, [type, isIncomingAccepted, contact]);

  // Poll active session & exchange WebRTC SDP Offer/Answer and ICE Candidates
  useEffect(() => {
    const signalInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/messages/calls/signal");
        if (res.ok) {
          const data = await res.json();
          const session = data.session;
          const pc = peerConnectionRef.current;

          if (session && pc) {
            if (session.status === "CONNECTED") {
              setCallState("connected");
            } else if (session.status === "REJECTED" || session.status === "ENDED") {
              setCallState("declined");
              setTimeout(() => {
                onEndCall();
              }, 400);
            }

            // Recipient handles SDP Offer from Caller
            if (isIncomingAccepted && session.sdpOffer && !pc.remoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(session.sdpOffer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              fetch("/api/messages/calls/signal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SDP_ANSWER", sdp: answer })
              }).catch(() => {});
            }

            // Caller handles SDP Answer from Recipient
            if (!isIncomingAccepted && session.sdpAnswer && pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(session.sdpAnswer));
            }

            // Process Remote ICE Candidates
            const candidates = isIncomingAccepted ? session.callerCandidates : session.recipientCandidates;
            if (candidates && candidates.length > 0) {
              for (const cand of candidates) {
                const candStr = JSON.stringify(cand);
                if (!processedIceCandidatesRef.current.has(candStr)) {
                  processedIceCandidatesRef.current.add(candStr);
                  await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                }
              }
            }
          } else if (!isIncomingAccepted && Date.now() - callInitTimeRef.current > 5000) {
            onEndCall();
          }
        }
      } catch (e) {}
    }, 250);

    return () => clearInterval(signalInterval);
  }, [isIncomingAccepted, onEndCall]);

  // Handle Proximity Sensor API for screen auto-dim when near ear
  useEffect(() => {
    if (typeof window === "undefined") return;

    let sensor: any = null;
    try {
      if ("ProximitySensor" in window) {
        sensor = new (window as any).ProximitySensor();
        sensor.addEventListener("reading", () => {
          setIsNearEarMode(Boolean(sensor.near));
        });
        sensor.start();
      }
    } catch (e) {}

    return () => {
      if (sensor) {
        try { sensor.stop(); } catch (e) {}
      }
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callState !== "connected") return;

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  // Handle Mute Toggle
  useEffect(() => {
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Handle Video Toggle
  useEffect(() => {
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
    }
  }, [isVideoEnabled]);

  const handleEndCallClick = () => {
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    fetch("/api/messages/calls/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "END" })
    }).catch(() => {});

    onEndCall();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: isNearEarMode ? "rgba(0, 0, 0, 0.99)" : "rgba(0, 0, 0, 0.92)",
        backdropFilter: isNearEarMode ? "none" : "blur(36px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "48px 24px",
        overflow: "hidden"
      }} 
      className="animate-fade-in"
    >
      {/* Remote Peer Voice Audio Output Element */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      {/* Near-Ear Screen Off Black Overlay */}
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

      {/* Ambient Blurred Background Avatar Artwork */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${contact.avatar})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(65px) brightness(0.22)",
          opacity: 0.65,
          transform: "scale(1.1)",
          zIndex: 0
        }} 
      />

      {/* Top Header info */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 2 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255, 255, 255, 0.12)", padding: "6px 18px",
          borderRadius: "9999px", color: "white", fontSize: "0.85rem", fontWeight: 800,
          border: "1px solid rgba(255, 255, 255, 0.2)", backdropFilter: "blur(12px)"
        }}>
          <Shield size={16} style={{ color: "#10b981" }} /> End-to-End Encrypted Live {type === "voice" ? "Voice" : "Video"} Call
        </div>

        <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", margin: "14px 0 2px 0", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
          {contact.name}
        </h2>
        
        <span style={{ 
          fontSize: "1rem", 
          color: callState === "connected" ? "#10b981" : callState === "declined" ? "#ef4444" : "#00f2fe", 
          fontWeight: 700, 
          display: "flex", 
          alignItems: "center", 
          gap: "6px" 
        }}>
          {callState === "ringing" ? (
            <>
              <PhoneCall size={16} className="animate-pulse" /> Ringing...
            </>
          ) : callState === "declined" ? (
            "Call Declined"
          ) : (
            `Connected • ${formatTimer(callDuration)}`
          )}
        </span>

        {/* Live Status Banners */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
          {isMuted && (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.5)",
              padding: "4px 12px", borderRadius: "99px", color: "#ef4444", fontSize: "0.78rem", fontWeight: 800
            }}>
              <MicMutedIcon size={14} /> Mic Muted
            </div>
          )}
          {isEarpieceMode && (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(168, 85, 247, 0.2)", border: "1px solid rgba(168, 85, 247, 0.5)",
              padding: "4px 12px", borderRadius: "99px", color: "#a855f7", fontSize: "0.78rem", fontWeight: 800
            }}>
              <Headphones size={14} /> Earpiece Mode
            </div>
          )}
        </div>
      </div>

      {/* Center Visual Content with Live Equalizer Waves */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: "100%",
        maxHeight: "520px",
        flex: 1,
        zIndex: 2
      }}>
        {type === "voice" ? (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Live Voice Pitch Frequency Visualizer Equalizer Rings */}
            <div style={{
              position: "absolute",
              width: `${180 + voiceVolume * 1.2}px`,
              height: `${180 + voiceVolume * 1.2}px`,
              borderRadius: "50%",
              border: "3px solid rgba(0, 242, 254, 0.7)",
              boxShadow: "0 0 30px rgba(0, 242, 254, 0.4)",
              transition: "all 0.08s ease-out",
              opacity: isMuted ? 0.2 : 0.8
            }} />

            <div style={{
              position: "absolute",
              width: `${230 + voiceVolume * 1.6}px`,
              height: `${230 + voiceVolume * 1.6}px`,
              borderRadius: "50%",
              border: "2px solid rgba(168, 85, 247, 0.5)",
              boxShadow: "0 0 40px rgba(168, 85, 247, 0.3)",
              transition: "all 0.08s ease-out",
              opacity: isMuted ? 0.2 : 0.7
            }} />

            {/* Avatar Image */}
            <img
              src={contact.avatar}
              alt={contact.name}
              style={{
                width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover",
                border: "4px solid #00f2fe", boxShadow: "0 0 50px rgba(0, 242, 254, 0.5)",
                zIndex: 2
              }}
            />
          </div>
        ) : (
          /* Real WebRTC Video Call Stream Container */
          <div style={{
            width: "100%", maxWidth: "640px", height: "100%", minHeight: "360px",
            borderRadius: "28px", overflow: "hidden", background: "#111111",
            position: "relative", border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
          }}>
            {/* Contact Remote Video Feed */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Real Camera Self-View Feed (PiP Badge) */}
            <div style={{
              position: "absolute", bottom: "20px", right: "20px",
              width: "120px", height: "160px", borderRadius: "18px",
              background: "#000", border: "2px solid rgba(255, 255, 255, 0.4)",
              overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
            }}>
              {isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%", background: "#222",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.8rem"
                }}>
                  Cam Off
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Mute, Speaker/Earpiece, Near-Ear Lock, End Call */}
      <div style={{
        display: "flex", alignItems: "center", gap: "16px",
        background: "rgba(255, 255, 255, 0.14)", padding: "14px 28px",
        borderRadius: "9999px", border: "1px solid rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(24px)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 2
      }}>
        {/* Mute Mic Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isMuted ? "0 4px 18px rgba(239, 68, 68, 0.6)" : "none",
            transition: "all 0.15s ease"
          }}
          className="hover:scale-110 active:scale-95"
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Loudspeaker vs Earpiece Route Button */}
        <button
          onClick={() => {
            setIsSpeakerOn(!isSpeakerOn);
            setIsEarpieceMode(isSpeakerOn);
            if (remoteAudioRef.current) {
              remoteAudioRef.current.volume = isSpeakerOn ? 0.3 : 1.0;
            }
          }}
          style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: isEarpieceMode ? "#8b5cf6" : "rgba(255, 255, 255, 0.2)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isEarpieceMode ? "0 4px 18px rgba(139, 92, 246, 0.6)" : "none"
          }}
          className="hover:scale-110 active:scale-95"
          title={isEarpieceMode ? "Switch to Loudspeaker" : "Switch to Earpiece Receiver"}
        >
          {isEarpieceMode ? <Headphones size={22} /> : <Volume2 size={22} />}
        </button>

        {/* Near Ear Screen Off Button */}
        <button
          onClick={() => setIsNearEarMode(true)}
          style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
          className="hover:scale-110 active:scale-95"
          title="Near-Ear Screen Off Mode"
        >
          <Smartphone size={22} />
        </button>

        {/* Video Toggle */}
        {type === "video" && (
          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: !isVideoEnabled ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            className="hover:scale-110 active:scale-95"
            title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
          >
            {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={handleEndCallClick}
          style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 30px rgba(239, 68, 68, 0.65)"
          }}
          className="hover:scale-110 active:scale-95"
          title="End Call"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  );
}
