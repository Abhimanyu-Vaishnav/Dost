import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SSE_CONTROLLERS } from "@/lib/callEngine";

// GET /api/calls/sse - Sub-50ms Real-Time Push Stream Event Endpoint
export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userPayload: any = await verifyToken(token);
  if (!userPayload || !userPayload.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const currentUserId = String(userPayload.userId).toLowerCase().trim();
  const currentUsername = typeof userPayload.username === "string" 
    ? userPayload.username.replace("@", "").toLowerCase().trim() 
    : "";

  const stream = new ReadableStream({
    start(controller) {
      // Register controller for both GUID and username for instant lookup
      SSE_CONTROLLERS.set(currentUserId, controller);
      if (currentUsername) {
        SSE_CONTROLLERS.set(currentUsername, controller);
      }

      // Send initial heartbeat connection ping
      const initMessage = `data: ${JSON.stringify({ type: "CONNECTED", timestamp: Date.now() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initMessage));

      // Keep-alive ping interval every 15 seconds to prevent tunnel timeouts
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": ping\n\n"));
        } catch (e) {
          clearInterval(pingInterval);
          SSE_CONTROLLERS.delete(currentUserId);
          if (currentUsername) SSE_CONTROLLERS.delete(currentUsername);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        SSE_CONTROLLERS.delete(currentUserId);
        if (currentUsername) SSE_CONTROLLERS.delete(currentUsername);
      });
    },
    cancel() {
      SSE_CONTROLLERS.delete(currentUserId);
      if (currentUsername) SSE_CONTROLLERS.delete(currentUsername);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
