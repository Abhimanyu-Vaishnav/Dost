import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipientId, amount, message } = await req.json();

    if (!recipientId || !amount) {
      return NextResponse.json({ error: "Recipient and amount required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully tipped $${amount} to creator!`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Tipping failed" }, { status: 500 });
  }
}
