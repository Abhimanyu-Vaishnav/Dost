// Complete Ground-Up WebRTC Call Engine & Robust HD Audio Synthesizer

export type CallState = "IDLE" | "OUTGOING_RINGING" | "INCOMING_RINGING" | "CONNECTED" | "DECLINED" | "ENDED";

export interface CallSessionData {
  sessionId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  callType: "voice" | "video";
  status: "RINGING" | "CONNECTED" | "REJECTED" | "ENDED";
  sdpOffer?: any;
  sdpAnswer?: any;
  callerCandidates?: any[];
  recipientCandidates?: any[];
  updatedAt: number;
}

// In-memory active call state store (Attached to globalThis for Next.js API route singleton persistence)
const globalForCalls = globalThis as unknown as {
  callSessionsMap?: Map<string, CallSessionData>;
  userSessionMap?: Map<string, string>;
};

export const CALL_STATE_STORE = {
  sessions: globalForCalls.callSessionsMap || (globalForCalls.callSessionsMap = new Map<string, CallSessionData>()),
  userSessionMap: globalForCalls.userSessionMap || (globalForCalls.userSessionMap = new Map<string, string>())
};

// --- HD Ringtone Audio Synthesizer Engine ---
let activeAudioContext: AudioContext | null = null;
let activeToneOsc1: OscillatorNode | null = null;
let activeToneOsc2: OscillatorNode | null = null;
let activeGainNode: GainNode | null = null;
let vibrationInterval: any = null;

export function getOrCreateAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!activeAudioContext || activeAudioContext.state === "closed") {
      activeAudioContext = new AudioCtx({ sampleRate: 48000 });
    }
    if (activeAudioContext.state === "suspended") {
      activeAudioContext.resume().catch(() => {});
    }
    return activeAudioContext;
  } catch (e) {
    return null;
  }
}

// Claim System Audio Session (Pauses background Spotify, YouTube, Videos, etc.)
export function claimSystemAudioSession(callerName: string, callType: string) {
  try {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `📞 ${callType.toUpperCase()} Call with ${callerName}`,
        artist: "DOST Call Engine",
        album: "HD Encrypted Voice"
      });
    }
  } catch (e) {}
}

export function releaseSystemAudioSession() {
  try {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.metadata = null;
    }
  } catch (e) {}
}

// Start continuous dual-frequency US Ringback Tone loop
export function startOutgoingRingbackSound() {
  stopAllRingtones();
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  try {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(480, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();

    activeToneOsc1 = osc1;
    activeToneOsc2 = osc2;
    activeGainNode = gainNode;
  } catch (e) {}
}

// Start continuous high-pitched FaceTime/WhatsApp-style Incoming Caller Tune sound loop
export function startIncomingCallerTuneSound() {
  stopAllRingtones();
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  try {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(853, ctx.currentTime);
    osc2.frequency.setValueAtTime(960, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.18, ctx.currentTime);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();

    activeToneOsc1 = osc1;
    activeToneOsc2 = osc2;
    activeGainNode = gainNode;
  } catch (e) {}
}

// WhatsApp-Style Haptic Pattern Device Vibration
export function triggerDeviceVibration() {
  try {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([600, 300, 600, 300, 600, 300]);
      if (!vibrationInterval) {
        vibrationInterval = setInterval(() => {
          if (typeof window !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([600, 300, 600, 300, 600, 300]);
          }
        }, 3000);
      }
    }
  } catch (e) {}
}

// Trigger Native Browser System Notification
export function triggerSystemNotification(callerName: string, callType: string) {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(`📞 Incoming ${callType === "voice" ? "Voice" : "Video"} Call`, {
        body: `${callerName} is calling you live. Tap to answer!`,
        icon: `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}&background=00f2fe&color=ffffff`,
        requireInteraction: true
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(`📞 Incoming ${callType === "voice" ? "Voice" : "Video"} Call`, {
            body: `${callerName} is calling you live. Tap to answer!`,
            icon: `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}&background=00f2fe&color=ffffff`,
            requireInteraction: true
          });
        }
      });
    }
  } catch (e) {}
}

// Stop All Ringtone Sounds, MediaSession & Vibration
export function stopAllRingtones() {
  try {
    if (activeToneOsc1) {
      activeToneOsc1.stop();
      activeToneOsc1.disconnect();
      activeToneOsc1 = null;
    }
    if (activeToneOsc2) {
      activeToneOsc2.stop();
      activeToneOsc2.disconnect();
      activeToneOsc2 = null;
    }
    if (activeGainNode) {
      activeGainNode.disconnect();
      activeGainNode = null;
    }
    if (vibrationInterval) {
      clearInterval(vibrationInterval);
      vibrationInterval = null;
    }
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(0);
    }
    releaseSystemAudioSession();
  } catch (e) {}
}
