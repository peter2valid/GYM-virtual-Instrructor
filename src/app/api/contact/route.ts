import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, gymName, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Log contact request (can be wired to email/Slack/etc. later)
  console.log("[contact]", { name, email, gymName, message, ts: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
