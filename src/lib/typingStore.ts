// Global in-memory store for typing heartbeats: key = `${conversationId}:${userId}`, value = timestamp
export const TYPING_STORES: Map<string, number> = new Map();
