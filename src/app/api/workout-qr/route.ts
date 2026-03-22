import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gymSlug = searchParams.get("gymSlug");
  const workoutId = searchParams.get("workoutId");

  if (!gymSlug || !workoutId) {
    return NextResponse.json({ error: "gymSlug and workoutId required" }, { status: 400 });
  }

  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const url = `${protocol}://${host}/g/${gymSlug}/workouts/${workoutId}`;

  const dataUrl = await QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return NextResponse.json({ dataUrl, url });
}
