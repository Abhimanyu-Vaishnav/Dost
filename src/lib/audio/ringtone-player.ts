// Web Audio API Ringtone & Caller Tune Synthesizer (No external MP3 dependencies)

class RingtonePlayer {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timer: any = null;

  /**
   * INCOMING CALL: Sweet modern musical smartphone chime ringtone
   */
  public startIncomingRingtone() {
    this.stopRingtone();
    this.isPlaying = true;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.audioCtx = new AudioCtxClass();

      const playMelodyBurst = () => {
        if (!this.isPlaying || !this.audioCtx) return;

        try {
          if (this.audioCtx.state === "suspended") {
            this.audioCtx.resume().catch(() => {});
          }

          // Melodic note frequencies (C5, E5, G5, C6, E6)
          const notes = [
            { note: 523.25, time: 0 },
            { note: 659.25, time: 0.14 },
            { note: 783.99, time: 0.28 },
            { note: 1046.50, time: 0.42 },
            { note: 1318.51, time: 0.56 },
            { note: 1046.50, time: 0.85 },
            { note: 1318.51, time: 0.99 },
          ];

          notes.forEach(({ note, time }) => {
            if (!this.audioCtx || !this.isPlaying) return;
            const now = this.audioCtx.currentTime + time;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(note, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.4);
          });
        } catch (e) {}
      };

      playMelodyBurst();
      this.timer = setInterval(playMelodyBurst, 2500);
    } catch (err) {
      console.warn("Incoming ringtone error:", err);
    }
  }

  /**
   * OUTGOING CALL: Soft classic telephone dial-back ring tone
   */
  public startOutgoingRingtone() {
    this.stopRingtone();
    this.isPlaying = true;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.audioCtx = new AudioCtxClass();

      const playDialBurst = () => {
        if (!this.isPlaying || !this.audioCtx) return;

        try {
          if (this.audioCtx.state === "suspended") {
            this.audioCtx.resume().catch(() => {});
          }

          const now = this.audioCtx.currentTime;
          const osc1 = this.audioCtx.createOscillator();
          const osc2 = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc1.type = "sine";
          osc2.type = "sine";
          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
          gain.gain.setValueAtTime(0.12, now + 1.6);
          gain.gain.linearRampToValueAtTime(0, now + 1.8);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.8);
          osc2.stop(now + 1.8);
        } catch (e) {}
      };

      playDialBurst();
      this.timer = setInterval(playDialBurst, 4000);
    } catch (err) {
      console.warn("Outgoing ringtone error:", err);
    }
  }

  public stopRingtone() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close().catch(() => {});
      } catch (e) {}
      this.audioCtx = null;
    }
  }
}

export const ringtonePlayer = new RingtonePlayer();
