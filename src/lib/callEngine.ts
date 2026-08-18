// Complete Ground-Up WebRTC Call Engine & HD Audio Synthesizer

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

// In-memory active call state store
export const CALL_STATE_STORE = {
  sessions: new Map<string, CallSessionData>(),
  userSessionMap: new Map<string, string>()
};

// --- HD Ringtone Audio Synthesizer Engine ---
let activeAudioContext: AudioContext | null = null;
let outgoingInterval: any = null;
let incomingInterval: any = null;

export function getOrCreateAudioContext(): AudioContext {
  if (!activeAudioContext || activeAudioContext.state === "closed") {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    activeAudioContext = new AudioCtx();
  }
  if (activeAudioContext.state === "suspended") {
    activeAudioContext.resume().catch(() => {});
  }
  return activeAudioContext;
}

// Play Outgoing Ringback Tone ("tuuuun... tuuuun...") for Caller
export function startOutgoingRingbackSound() {
  stopAllRingtones();
  if (typeof window === "undefined") return;

  const playTone = () => {
    try {
      const ctx = getOrCreateAudioContext();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, now); // 440Hz Standard Dial Tone
      osc2.frequency.setValueAtTime(480, now); // 480Hz Harmonic Dual Tone

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.setValueAtTime(0.12, now + 1.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);
    } catch (e) {}
  };

  playTone();
  outgoingInterval = setInterval(playTone, 3500);
}

// Play Incoming Caller Tune ("trrrring... trrrring...") for Recipient
export function startIncomingCallerTuneSound() {
  stopAllRingtones();
  if (typeof window === "undefined") return;

  const playChime = () => {
    try {
      const ctx = getOrCreateAudioContext();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(523.25, now); // C5 Note
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5 Note
      osc2.frequency.setValueAtTime(659.25, now + 0.3);
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.8); // G5 Note

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.3);
      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
    } catch (e) {}
  };

  playChime();
  incomingInterval = setInterval(playChime, 2200);
}

// Stop All Ringtone Sounds
export function stopAllRingtones() {
  if (outgoingInterval) {
    clearInterval(outgoingInterval);
    outgoingInterval = null;
  }
  if (incomingInterval) {
    clearInterval(incomingInterval);
    incomingInterval = null;
  }
}
