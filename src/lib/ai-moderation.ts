export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  flaggedCategories?: string[];
}

const PROFANITY_LIST = ["hate", "abuse", "scam", "spam_bot", "illegal_action"];

export function moderateContent(content: string): ModerationResult {
  if (!content) return { allowed: true };

  const lower = content.toLowerCase();
  const flagged = PROFANITY_LIST.filter(word => lower.includes(word));

  if (flagged.length > 0) {
    return {
      allowed: false,
      reason: `Content flagged by AI moderation safety rules (contains: ${flagged.join(", ")})`,
      flaggedCategories: flagged,
    };
  }

  return { allowed: true };
}
