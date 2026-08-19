export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { presenceManager } from "@/lib/presence/presence-manager";

export async function GET(request: NextRequest) {
  // Extract user from auth token or query param fallback
  const userPayload = await getUserFromRequest(request);
  const searchParams = request.nextUrl.searchParams;
  const userId = (userPayload?.userId as string) || searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial SSE connection acknowledgment event
      const encoder = new TextEncoder();
      const initialPayload = `data: ${JSON.stringify({
        type: "connected",
        payload: {
          userId,
          timestamp: new Date().toISOString(),
        },
      })}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // Subscribe stream controller to presence manager
      const unsubscribe = presenceManager.subscribe(userId, controller);

      // Handle stream abort / client close
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Controller already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
