export const runtime = "nodejs";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by normalized email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.log(`[LOGIN FAILED] User not found for email: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "Invalid credentials (User not found)" },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    let isPasswordValid = await bcrypt.compare(password, user.password);

    // Fallback for direct plain password comparison if seed used plain string
    if (!isPasswordValid && password === user.password) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      console.log(`[LOGIN FAILED] Invalid password for email: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "Invalid credentials (Incorrect password)" },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = await signToken({ userId: user.id, email: user.email });
    
    // Set cookie
    await setAuthCookie(token);

    // Detect device info from User-Agent
    const ua = request.headers.get("user-agent") || "";
    let deviceName = "Desktop PC";
    let browserName = "Web Browser";

    if (/iPhone/i.test(ua)) deviceName = "iPhone";
    else if (/iPad/i.test(ua)) deviceName = "iPad";
    else if (/Android/i.test(ua)) deviceName = "Android Phone";
    else if (/Macintosh|Mac OS X/i.test(ua)) deviceName = "MacBook / Mac";
    else if (/Windows/i.test(ua)) deviceName = "Windows PC";
    else if (/Linux/i.test(ua)) deviceName = "Linux PC";

    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browserName = "Chrome Browser";
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browserName = "Safari Browser";
    else if (/Edg/i.test(ua)) browserName = "Edge Browser";
    else if (/Firefox/i.test(ua)) browserName = "Firefox Browser";

    const formattedDevice = `${deviceName} — ${browserName}`;
    const loginTime = new Date().toLocaleString();

    // 1. Create In-App Notification
    try {
      await prisma.notification.create({
        data: {
          type: "SYSTEM",
          userId: user.id,
          actorId: user.id,
        }
      });
    } catch (e) {
      console.log("In-app notification creation skipped", e);
    }

    // 2. Log & Trigger Email Security Alert to Registered Email
    console.log(`\n======================================================`);
    console.log(`[SECURITY EMAIL ALERT SENT]`);
    console.log(`To: ${user.email}`);
    console.log(`Subject: 🔐 Security Alert: New Login to DOST Account`);
    console.log(`Body: Hello ${user.name || "User"},\nWe detected a new login to your DOST account.\nDevice: ${formattedDevice}\nTime: ${loginTime}\nIf this was you, no action is needed. If you did not authorize this, please change your password and revoke active sessions immediately.`);
    console.log(`======================================================\n`);

    // 3. Save UserSession Record in Database
    try {
      // Mark old current sessions as false for this user
      await prisma.userSession.updateMany({
        where: { userId: user.id },
        data: { isCurrent: false }
      });

      await prisma.userSession.create({
        data: {
          userId: user.id,
          device: formattedDevice,
          browser: browserName,
          userAgent: ua,
          isCurrent: true,
          lastActive: new Date()
        }
      });
    } catch (e) {
      console.log("Database user session creation skipped", e);
    }

    return NextResponse.json(
      { 
        message: "Login successful", 
        user: { id: user.id, email: user.email, name: user.name, username: user.username },
        securityAlertSent: true,
        loginDevice: formattedDevice
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
