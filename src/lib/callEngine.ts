// Complete Production WebRTC Call Engine & Mobile Audio Synthesizer

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

// In-memory active call state store (Attached to globalThis for Next.js singleton persistence)
const globalForCalls = globalThis as unknown as {
  callSessionsMap?: Map<string, CallSessionData>;
  userSessionMap?: Map<string, string>;
  sseControllers?: Map<string, ReadableStreamDefaultController>;
};

export const CALL_STATE_STORE = {
  sessions: globalForCalls.callSessionsMap || (globalForCalls.callSessionsMap = new Map<string, CallSessionData>()),
  userSessionMap: globalForCalls.userSessionMap || (globalForCalls.userSessionMap = new Map<string, string>())
};

// Global SSE Connections Registry for Sub-50ms Instant Ringing
export const SSE_CONTROLLERS = globalForCalls.sseControllers || 
  (globalForCalls.sseControllers = new Map<string, ReadableStreamDefaultController>());

export function pushSSEEventToUser(userIdOrName?: string | null, data?: any) {
  if (!userIdOrName) return false;
  const key = String(userIdOrName).toLowerCase().replace("@", "").trim();
  const controller = SSE_CONTROLLERS.get(key);
  if (controller) {
    try {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(new TextEncoder().encode(payload));
      return true;
    } catch (e) {
      SSE_CONTROLLERS.delete(key);
    }
  }
  return false;
}

// --- HD Ringtone & Web Audio Synthesizer ---
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

// Global Touch Listener to unlock AudioContext on mobile Chrome / Safari
if (typeof window !== "undefined") {
  const unlockCtx = () => {
    if (activeAudioContext && activeAudioContext.state === "suspended") {
      activeAudioContext.resume().catch(() => {});
    }
  };
  window.addEventListener("click", unlockCtx, { capture: true });
  window.addEventListener("touchstart", unlockCtx, { capture: true });
  window.addEventListener("touchend", unlockCtx, { capture: true });
}

export function claimSystemAudioSession(callerName: string, callType: string) {
  try {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `DOST HD ${callType === "video" ? "Video" : "Voice"} Call`,
        artist: callerName || "DOST User",
        album: "DOST Real-Time Connection"
      });
      navigator.mediaSession.setActionHandler("pause", () => {});
      navigator.mediaSession.setActionHandler("stop", () => {});
    }
  } catch (e) {}
}

export function releaseSystemAudioSession() {
  try {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
    }
  } catch (e) {}
}

export function startIncomingCallerTuneSound() {
  stopAllRingtones();
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(480, ctx.currentTime);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    activeToneOsc1 = osc1;
    activeToneOsc2 = osc2;
    activeGainNode = gain;
  } catch (e) {}
}

export function startOutgoingRingbackSound() {
  stopAllRingtones();
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(480, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    activeToneOsc1 = osc1;
    activeToneOsc2 = osc2;
    activeGainNode = gain;
  } catch (e) {}
}

export function stopAllRingtones() {
  try {
    if (activeToneOsc1) { activeToneOsc1.stop(); activeToneOsc1.disconnect(); activeToneOsc1 = null; }
    if (activeToneOsc2) { activeToneOsc2.stop(); activeToneOsc2.disconnect(); activeToneOsc2 = null; }
    if (activeGainNode) { activeGainNode.disconnect(); activeGainNode = null; }
    if (vibrationInterval) { clearInterval(vibrationInterval); vibrationInterval = null; }
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0);
    }
  } catch (e) {}
}

export function triggerDeviceVibration() {
  try {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 800]);
    }
  } catch (e) {}
}

export function triggerSystemNotification(callerName: string, callType: string) {
  try {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(`Incoming DOST ${callType === "video" ? "Video" : "Voice"} Call`, {
        body: `${callerName} is calling you on DOST!`,
        icon: "/icon.svg",
        tag: "dost-incoming-call"
      });
    }
  } catch (e) {}
}
