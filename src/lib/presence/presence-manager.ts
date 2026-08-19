import { prisma } from "@/lib/prisma";

export interface UserPresenceState {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  typingConversationId?: string | null;
}

export interface SSEEvent {
  type: "presence_update" | "typing_update" | "heartbeat_ack" | "call_signal" | "message_new";
  payload: Record<string, unknown>;
}

class PresenceManager {
  // In-memory store for user presence states
  private presenceStore = new Map<string, UserPresenceState>();

  // In-memory SSE connections: userId -> Set of stream controllers
  private subscribers = new Map<string, Set<ReadableStreamDefaultController>>();

  // Active heartbeat timers: userId -> Timeout
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();

  // Active typing timers: userId -> Timeout
  private typingTimers = new Map<string, NodeJS.Timeout>();

  // Heartbeat timeout threshold: 45 seconds
  private readonly HEARTBEAT_TIMEOUT_MS = 45000;
  // Auto-stop typing threshold: 5 seconds
  private readonly TYPING_TIMEOUT_MS = 5000;

  constructor() {
    // Prevent duplicate background sweeps on HMR hot reloads
    if (process.env.NODE_ENV !== "production") {
      const globalObj = globalThis as unknown as { __presenceManagerInstance?: PresenceManager };
      if (globalObj.__presenceManagerInstance) {
        return globalObj.__presenceManagerInstance;
      }
      globalObj.__presenceManagerInstance = this;
    }
  }

  /**
   * Subscribe an HTTP SSE connection stream for a given user.
   */
  public subscribe(userId: string, controller: ReadableStreamDefaultController): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(controller);

    // Mark user online upon active SSE connection
    this.recordHeartbeat(userId);

    // Return cleanup function to call on client disconnect
    return () => {
      const userSubs = this.subscribers.get(userId);
      if (userSubs) {
        userSubs.delete(controller);
        if (userSubs.size === 0) {
          this.subscribers.delete(userId);
        }
      }
    };
  }

  /**
   * Record a heartbeat from a user (received every 15s from client).
   * Resets the 45s offline timeout timer.
   */
  public async recordHeartbeat(userId: string): Promise<UserPresenceState> {
    const now = new Date();
    const existing = this.presenceStore.get(userId);
    const wasOffline = !existing || !existing.isOnline;

    const newState: UserPresenceState = {
      userId,
      isOnline: true,
      lastSeen: now,
      typingConversationId: existing?.typingConversationId || null,
    };

    this.presenceStore.set(userId, newState);

    // Reset 45-second offline timer
    if (this.heartbeatTimers.has(userId)) {
      clearTimeout(this.heartbeatTimers.get(userId)!);
    }

    const timer = setTimeout(() => {
      this.handleUserOffline(userId);
    }, this.HEARTBEAT_TIMEOUT_MS);

    this.heartbeatTimers.set(userId, timer);

    // Broadcast presence update if state transitioned from offline -> online
    if (wasOffline) {
      this.broadcastPresenceUpdate(userId, true, now);
      this.syncPresenceToDatabase(userId, true, now);
    }

    return newState;
  }

  /**
   * Called automatically when no heartbeat is received for 45s.
   */
  private async handleUserOffline(userId: string): Promise<void> {
    const now = new Date();
    const state = this.presenceStore.get(userId);

    if (state) {
      state.isOnline = false;
      state.lastSeen = now;
      state.typingConversationId = null;
    }

    this.heartbeatTimers.delete(userId);
    this.stopTyping(userId);

    // Broadcast offline status
    this.broadcastPresenceUpdate(userId, false, now);
    // Sync with database
    await this.syncPresenceToDatabase(userId, false, now);
  }

  /**
   * Update typing state for a user in a conversation.
   */
  public setTyping(userId: string, conversationId: string, isTyping: boolean): void {
    const state = this.presenceStore.get(userId);
    if (!state) return;

    if (isTyping) {
      state.typingConversationId = conversationId;

      // Reset auto-clear typing timer (5 seconds)
      if (this.typingTimers.has(userId)) {
        clearTimeout(this.typingTimers.get(userId)!);
      }

      const timer = setTimeout(() => {
        this.stopTyping(userId);
      }, this.TYPING_TIMEOUT_MS);

      this.typingTimers.set(userId, timer);

      this.broadcastTypingEvent(userId, conversationId, true);
    } else {
      this.stopTyping(userId);
    }
  }

  /**
   * Stop typing indicator for user.
   */
  public stopTyping(userId: string): void {
    const state = this.presenceStore.get(userId);
    const convId = state?.typingConversationId;

    if (this.typingTimers.has(userId)) {
      clearTimeout(this.typingTimers.get(userId)!);
      this.typingTimers.delete(userId);
    }

    if (state) {
      state.typingConversationId = null;
    }

    if (convId) {
      this.broadcastTypingEvent(userId, convId, false);
    }
  }

  /**
   * Get presence status for a specific user.
   */
  public getPresence(userId: string): UserPresenceState {
    const cached = this.presenceStore.get(userId);
    if (cached) return cached;

    return {
      userId,
      isOnline: false,
      lastSeen: new Date(0),
      typingConversationId: null,
    };
  }

  /**
   * Get presence statuses for multiple users.
   */
  public getMultiplePresence(userIds: string[]): Record<string, UserPresenceState> {
    const result: Record<string, UserPresenceState> = {};
    for (const id of userIds) {
      result[id] = this.getPresence(id);
    }
    return result;
  }

  /**
   * Send SSE event to a specific target user.
   */
  public sendToUser(targetUserId: string, event: SSEEvent): void {
    const userSubs = this.subscribers.get(targetUserId);
    if (!userSubs || userSubs.size === 0) return;

    const data = `data: ${JSON.stringify(event)}\n\n`;
    const encoder = new TextEncoder();
    const payload = encoder.encode(data);

    for (const controller of userSubs) {
      try {
        controller.enqueue(payload);
      } catch (err) {
        // Dead stream controller cleanup
        userSubs.delete(controller);
      }
    }
  }

  /**
   * Broadcast SSE event to all connected subscribers.
   */
  public broadcastAll(event: SSEEvent): void {
    for (const userId of this.subscribers.keys()) {
      this.sendToUser(userId, event);
    }
  }

  /**
   * Broadcast presence status (online/offline, lastSeen) to all clients.
   */
  private broadcastPresenceUpdate(userId: string, isOnline: boolean, lastSeen: Date): void {
    this.broadcastAll({
      type: "presence_update",
      payload: {
        userId,
        isOnline,
        lastSeen: lastSeen.toISOString(),
      },
    });
  }

  /**
   * Broadcast typing status to all active clients (client filters by active conversation).
   */
  private broadcastTypingEvent(userId: string, conversationId: string, isTyping: boolean): void {
    this.broadcastAll({
      type: "typing_update",
      payload: {
        userId,
        conversationId,
        isTyping,
      },
    });
  }

  /**
   * Sync presence state to database (UserPresence table and User.lastSeen).
   */
  private async syncPresenceToDatabase(userId: string, isOnline: boolean, lastSeen: Date): Promise<void> {
    try {
      await prisma.$transaction([
        prisma.userPresence.upsert({
          where: { userId },
          create: {
            userId,
            isOnline,
            lastSeen,
          },
          update: {
            isOnline,
            lastSeen,
            updatedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { lastSeen },
        }),
      ]);
    } catch (error) {
      console.error(`[PresenceManager] DB sync error for user ${userId}:`, error);
    }
  }
}

// Global singleton instance
const globalForPresence = globalThis as unknown as {
  presenceManager: PresenceManager | undefined;
};

export const presenceManager = globalForPresence.presenceManager ?? new PresenceManager();

if (process.env.NODE_ENV !== "production") {
  globalForPresence.presenceManager = presenceManager;
}
