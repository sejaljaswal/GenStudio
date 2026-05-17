import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Upstream fetch failed: ${res.statusText}`);
    }
    const blob = await res.blob();
    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("Content-Type") || "image/png");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(blob, { headers });
  } catch (error: any) {
    console.error("Image proxy error:", error?.message || error);
    return new NextResponse("Failed to proxy image", { status: 500 });
  }
}
