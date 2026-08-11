export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key !== "dost2026") {
      return NextResponse.json(
        { error: "Unauthorized. Pass ?key=dost2026 to run database setup." },
        { status: 401 }
      );
    }

    console.log("Starting Prisma DB Push on Vercel...");
    const output = execSync("npx prisma db push --accept-data-loss", {
      env: { ...process.env },
      encoding: "utf-8"
    });

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully on Vercel Postgres!",
      output
    });
  } catch (error: any) {
    console.error("DB Setup Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        stderr: error?.stderr ? String(error.stderr) : undefined
      },
      { status: 500 }
    );
  }
}
