export interface CallSignal {
  id: string;
  action: "OFFER" | "ANSWER" | "REJECT" | "END";
  conversationId?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  callType: "voice" | "video";
  timestamp: number;
}

// In-memory store for active call signals: key = target userId, value = CallSignal
export const CALL_SIGNALS_MAP: Map<string, CallSignal> = new Map();
