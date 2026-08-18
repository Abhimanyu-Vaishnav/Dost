// Complete Ground-Up WebRTC Call Engine & Continuous HD Audio Synthesizer

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

// --- Continuous HD Ringtone Audio Synthesizer Engine ---
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
      activeAudioContext = new AudioCtx();
    }
    if (activeAudioContext.state === "suspended") {
      activeAudioContext.resume().catch(() => {});
    }
    return activeAudioContext;
  } catch (e) {
    return null;
  }
}

// Play Continuous Outgoing Ringback Tone ("tuuuun... tuuuun...") for Caller
export function startOutgoingRingbackSound() {
  stopAllRingtones();
  if (typeof window === "undefined") return;

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(480, ctx.currentTime);

    // Continuous 2s on, 1.5s subtle modulation cycle without full silence gaps
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    
    // LFO gain modulation for continuous tone loop
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.25, ctx.currentTime); // 4-second cycle
    lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

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

// Play Continuous Incoming Caller Tune ("trrrring... trrrring...") & Trigger Device Vibration
export function startIncomingCallerTuneSound() {
  stopAllRingtones();
  if (typeof window === "undefined") return;

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

    gain.gain.setValueAtTime(0.18, ctx.currentTime);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.4, ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.12, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    activeToneOsc1 = osc1;
    activeToneOsc2 = osc2;
    activeGainNode = gain;

    // Trigger Physical Device Haptic Vibration (WhatsApp style call pulse)
    triggerDeviceVibration();
  } catch (e) {}
}

// Trigger WhatsApp-Style Device Vibration
export function triggerDeviceVibration() {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  const doVibrate = () => {
    try {
      navigator.vibrate([600, 300, 600, 300, 600]);
    } catch (e) {}
  };

  doVibrate();
  if (!vibrationInterval) {
    vibrationInterval = setInterval(doVibrate, 2500);
  }
}

// Trigger Browser Native System Notification
export function triggerSystemNotification(callerName: string, callType: string = "voice") {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  try {
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

// Stop All Ringtone Sounds & Vibration
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
      navigator.vibrate(0); // Stop physical vibration
    }
  } catch (e) {}
}
