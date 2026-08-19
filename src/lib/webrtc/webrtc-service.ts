/**
 * ============================================================================
 * WebRTC Calling Engine (Production-Grade)
 * ============================================================================
 * Handles PeerConnection creation, ICE negotiation, MediaStreams,
 * track controls (mute/unmute/camera toggle), and persistent remote audio attachment.
 */

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export const DEFAULT_RTC_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelay",
      credential: "openrelay",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelay",
      credential: "openrelay",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelay",
      credential: "openrelay",
    },
  ],
};

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;

  public getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  /**
   * Initialize PeerConnection with STUN & TURN servers
   */
  public initPeerConnection(
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onRemoteStream: (stream: MediaStream) => void
  ): RTCPeerConnection {
    // If PeerConnection already exists and is active, do not recreate it (prevents dropping on accept)
    if (this.pc && (this.pc.connectionState === "connecting" || this.pc.connectionState === "connected" || this.pc.signalingState !== "closed")) {
      console.log("[WebRTC] Reusing existing active PeerConnection. Signaling state:", this.pc.signalingState);
      this.onIceCandidateCallback = onIceCandidate;
      this.onRemoteStreamCallback = onRemoteStream;
      return this.pc;
    }

    console.log("[WebRTC] Initializing new RTCPeerConnection...");
    this.closeConnection();

    this.onIceCandidateCallback = onIceCandidate;
    this.onRemoteStreamCallback = onRemoteStream;

    this.pc = new RTCPeerConnection(DEFAULT_RTC_CONFIG);
    this.remoteStream = new MediaStream();

    // Ensure audio transceiver is registered in SDP offer/answer
    try {
      this.pc.addTransceiver("audio", { direction: "sendrecv" });
      console.log("[WebRTC] Added sendrecv audio transceiver.");
    } catch (e) {
      console.warn("[WebRTC] addTransceiver warning:", e);
    }

    // 1A. ICE Candidate Handler
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[WebRTC] Generated Local ICE candidate:", event.candidate.candidate.substring(0, 40) + "...");
        if (this.onIceCandidateCallback) {
          this.onIceCandidateCallback(event.candidate);
        }
      } else {
        console.log("[WebRTC] ICE candidate gathering complete.");
      }
    };

    // 1B. Connection state monitoring
    this.pc.onconnectionstatechange = () => {
      console.log("[WebRTC] ConnectionState changed:", this.pc?.connectionState);
      if (this.pc?.connectionState === "failed" || this.pc?.connectionState === "disconnected") {
        console.warn("[WebRTC] Connection degraded. Attempting ICE restart...");
        this.restartIce().catch((e) => console.error("[WebRTC] ICE restart error:", e));
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE ConnectionState changed:", this.pc?.iceConnectionState);
      if (this.pc?.iceConnectionState === "failed" || this.pc?.iceConnectionState === "disconnected") {
        console.warn("[WebRTC] ICE state failed/disconnected. Attempting ICE restart...");
        this.restartIce().catch((e) => console.error("[WebRTC] ICE restart error:", e));
      }
    };

    // 1C. Handle incoming remote media tracks (INDEPENDENT REMOTE AUDIO ENGINE)
    this.pc.ontrack = (event) => {
      console.log("[WebRTC LOG] 1. ONTRACK FIRED! Kind:", event.track.kind, "| ID:", event.track.id, "| State:", event.track.readyState);
      
      event.track.enabled = true;

      // Track Mute/Unmute/Ended state listeners
      event.track.onmute = () => {
        console.warn("[WebRTC LOG] Remote track muted by browser! Re-enabling...", event.track.kind);
        event.track.enabled = true;
      };

      event.track.onunmute = () => {
        console.log("[WebRTC LOG] Remote track unmuted:", event.track.kind);
        event.track.enabled = true;
      };

      event.track.onended = () => {
        console.warn("[WebRTC LOG] Remote track ended:", event.track.kind);
      };

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          t.enabled = true;
          if (this.remoteStream && !this.remoteStream.getTracks().some((existing) => existing.id === t.id)) {
            console.log("[WebRTC LOG] Adding track to remote stream:", t.kind);
            this.remoteStream.addTrack(t);
          }
        });
      } else if (this.remoteStream) {
        if (!this.remoteStream.getTracks().some((existing) => existing.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }

      // Attach to persistent <audio id="remoteAudio"> IMMEDIATELY AND LOCK IT
      if (typeof window !== "undefined") {
        let remoteAudio = document.getElementById("remoteAudio") as HTMLAudioElement | null;
        if (!remoteAudio) {
          remoteAudio = document.createElement("audio");
          remoteAudio.id = "remoteAudio";
          remoteAudio.autoplay = true;
          (remoteAudio as any).playsInline = true;
          remoteAudio.style.display = "none";
          document.body.appendChild(remoteAudio);
        }

        if (remoteAudio && this.remoteStream) {
          if (remoteAudio.srcObject !== this.remoteStream) {
            console.log("[WebRTC LOG] 2. BINDING UNIQUE srcObject on <audio id='remoteAudio'>");
            remoteAudio.srcObject = this.remoteStream;
          } else {
            console.log("[WebRTC LOG] 2. srcObject ALREADY BOUND to remoteStream. Keeping stream lock.");
          }

          remoteAudio.volume = 1.0;
          remoteAudio.muted = false;

          console.log("[WebRTC LOG] 3. CALLING play() on persistent <audio id='remoteAudio'>");
          remoteAudio
            .play()
            .then(() => {
              console.log("[WebRTC LOG] 4. PLAY() SUCCESSFUL! Remote audio playing independently!");
            })
            .catch((err) => {
              console.warn("[WebRTC LOG] play() deferred/blocked:", err);
            });
        }
      }

      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    return this.pc;
  }

  /**
   * Attempt ICE restart to recover broken connection
   */
  public async restartIce(): Promise<void> {
    if (!this.pc) return;
    try {
      console.log("[WebRTC] Executing PC restartIce...");
      if (typeof this.pc.restartIce === "function") {
        this.pc.restartIce();
      }
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
    } catch (err) {
      console.error("[WebRTC] restartIce error:", err);
    }
  }

  /**
   * Force re-enable all tracks on both local and remote streams
   */
  public forceEnableAllTracks(): void {
    console.log("[WebRTC] Force-enabling all local and remote tracks...");
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        t.enabled = true;
      });
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((t) => {
        t.enabled = true;
      });
    }
  }

  /**
   * Capture local media (audio/video) and attach tracks to PeerConnection
   */
  public async getLocalStream(isVideo: boolean): Promise<MediaStream> {
    try {
      // If localStream already exists with active live tracks, reuse it (prevents tracks from transitioning to 'ended')
      if (this.localStream && this.localStream.getAudioTracks().some((t) => t.readyState === "live")) {
        console.log("[WebRTC] Reusing existing live localMedia stream!");
        if (this.pc) {
          this.localStream.getTracks().forEach((track) => {
            track.enabled = true;
            if (this.pc && !this.pc.getSenders().some((s) => s.track?.id === track.id)) {
              console.log("[WebRTC] Adding local track to PeerConnection:", track.kind);
              this.pc.addTrack(track, this.localStream!);
            }
          });
        }
        return this.localStream;
      }

      console.log("[WebRTC] Requesting new local media (audio=true, video=" + isVideo + ")");
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[WebRTC] Local media stream acquired with tracks:", this.localStream.getTracks().map(t => `${t.kind}:${t.readyState}`));

      if (this.pc) {
        const senders = this.pc.getSenders();
        this.localStream.getTracks().forEach((track) => {
          track.enabled = true;
          const matchingSender = senders.find((s) => s.track?.kind === track.kind || (s as any).searchKind === track.kind);
          if (matchingSender && typeof matchingSender.replaceTrack === "function") {
            console.log("[WebRTC] Replacing sender track with live local track:", track.kind);
            matchingSender.replaceTrack(track).catch(e => console.warn("[WebRTC] replaceTrack warning:", e));
          } else if (this.localStream && this.pc && !senders.some((s) => s.track?.id === track.id)) {
            console.log("[WebRTC] Adding local track to PeerConnection:", track.kind);
            this.pc.addTrack(track, this.localStream);
          }
        });
      }

      return this.localStream;
    } catch (error) {
      console.error("[WebRTC] getUserMedia failed:", error);
      throw error;
    }
  }

  /**
   * CALLER -> Create Offer SDP and set local description
   */
  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("PeerConnection not initialized");

    console.log("[WebRTC] Creating SDP offer...");
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    console.log("[WebRTC] Setting local description (Offer)...");
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * CALLEE -> Handle Offer SDP and Create Answer SDP
   */
  public async handleOfferAndCreateAnswer(
    offerSDP: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("PeerConnection not initialized");

    console.log("[WebRTC] Setting remote description (Offer)...");
    await this.pc.setRemoteDescription(new RTCSessionDescription(offerSDP));

    console.log("[WebRTC] Creating SDP answer...");
    const answer = await this.pc.createAnswer();

    console.log("[WebRTC] Setting local description (Answer)...");
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * CALLER -> Handle Answer SDP from Callee
   */
  public async handleAnswer(answerSDP: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) throw new Error("PeerConnection not initialized");
    console.log("[WebRTC] Setting remote description (Answer)...");
    await this.pc.setRemoteDescription(new RTCSessionDescription(answerSDP));
  }

  /**
   * Add ICE Candidate received from signaling route
   */
  public async addIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) return;
    try {
      if (this.pc.remoteDescription) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        console.log("[WebRTC] Added ICE candidate successfully.");
      } else {
        console.log("[WebRTC] Queuing ICE candidate (remoteDescription not set yet)...");
        // Store candidate or retry after remote description
        setTimeout(async () => {
          if (this.pc && this.pc.remoteDescription) {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(() => {});
          }
        }, 500);
      }
    } catch (err) {
      console.error("[WebRTC] Failed to add ICE candidate:", err);
    }
  }

  /**
   * Toggle Mute / Unmute Mic
   */
  public toggleMute(muted: boolean): boolean {
    console.log("[WebRTC LOG] Local Mic toggleMute called:", muted);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
        console.log("[WebRTC LOG] Local Audio Track updated. ID:", track.id, "Enabled:", track.enabled);
      });
    }
    return muted;
  }

  /**
   * Toggle Camera On / Off
   */
  public toggleCamera(off: boolean): boolean {
    console.log("[WebRTC LOG] Local Camera toggleCamera called:", off);
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !off;
        console.log("[WebRTC LOG] Local Video Track updated. ID:", track.id, "Enabled:", track.enabled);
      });
    }
    return off;
  }

  /**
   * Get Current Local Stream
   */
  public getStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get Current Remote Stream
   */
  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Enumerate all connected audio input and output devices (Headphones, Bluetooth, Speaker)
   */
  public async getAudioDevices(): Promise<{ inputs: MediaDeviceInfo[]; outputs: MediaDeviceInfo[] }> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return { inputs: [], outputs: [] };
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === "audioinput");
      const outputs = devices.filter((d) => d.kind === "audiooutput");
      console.log("[WebRTC LOG] Discovered Audio Devices:", { inputsCount: inputs.length, outputsCount: outputs.length });
      return { inputs, outputs };
    } catch (e) {
      console.warn("[WebRTC LOG] enumerateDevices failed:", e);
      return { inputs: [], outputs: [] };
    }
  }

  /**
   * Set specific audio output sink (Earpiece / Speaker / Headphones / Bluetooth)
   */
  public async setAudioOutputDevice(currentMode?: "speaker" | "earpiece"): Promise<"speaker" | "earpiece"> {
    if (typeof window === "undefined") return "earpiece";
    const remoteAudio = document.getElementById("remoteAudio") as HTMLAudioElement | any;
    const targetMode: "speaker" | "earpiece" = currentMode === "earpiece" ? "speaker" : "earpiece";

    try {
      const { outputs } = await this.getAudioDevices();
      console.log("[WebRTC LOG] Audio outputs detected:", outputs.map((o) => o.label || o.deviceId));

      const speakerDevice = outputs.find(
        (d) => d.label.toLowerCase().includes("speaker") || d.label.toLowerCase().includes("loud")
      );
      const earpieceDevice = outputs.find(
        (d) => d.label.toLowerCase().includes("earpiece") || d.label.toLowerCase().includes("receiver") || d.deviceId === "default"
      );

      let targetSinkId = "";
      if (targetMode === "speaker") {
        targetSinkId = speakerDevice ? speakerDevice.deviceId : outputs[1]?.deviceId || "speaker";
      } else {
        targetSinkId = earpieceDevice ? earpieceDevice.deviceId : "default";
      }

      if (remoteAudio && typeof remoteAudio.setSinkId === "function") {
        await remoteAudio.setSinkId(targetSinkId === "default" ? "" : targetSinkId);
        console.log("[WebRTC LOG] Smoothly switched HTML5 audio sink to:", targetMode, "(sinkId:", targetSinkId, ")");
      } else if (remoteAudio) {
        // Fallback for mobile WebKit engines: Adjust HTML5 audio volume & gain
        remoteAudio.volume = targetMode === "speaker" ? 1.0 : 0.6;
        console.log("[WebRTC LOG] Fallback audio gain adjusted for mode:", targetMode);
      }

      return targetMode;
    } catch (err) {
      console.warn("[WebRTC LOG] Audio output route error:", err);
      return targetMode;
    }
  }

  /**
   * Close connection and stop all media tracks
   */
  public closeConnection(): void {
    console.log("[WebRTC LOG] CALL END TRIGGERED! Closing peer connection and stopping tracks...");
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      this.pc.oniceconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
  }
}
