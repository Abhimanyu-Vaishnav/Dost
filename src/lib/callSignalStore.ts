export interface CallSession {
  sessionId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  callType: "voice" | "video";
  status: "RINGING" | "CONNECTED" | "REJECTED" | "ENDED";
  updatedAt: number;
  sdpOffer?: any;
  sdpAnswer?: any;
  callerCandidates?: any[];
  recipientCandidates?: any[];
}

// In-memory active call sessions map: sessionId -> CallSession
export const ACTIVE_CALL_SESSIONS: Map<string, CallSession> = new Map();

// Map from userId or username -> sessionId
export const USER_TO_SESSION_MAP: Map<string, string> = new Map();

export function setSessionForUserKeys(keys: (string | undefined)[], session: CallSession | null) {
  keys.forEach(k => {
    if (k) {
      if (session) {
        USER_TO_SESSION_MAP.set(k, session.sessionId);
      } else {
        USER_TO_SESSION_MAP.delete(k);
      }
    }
  });
}
