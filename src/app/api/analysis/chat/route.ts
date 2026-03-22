import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  try {
    const { chatWithPerspective } = await import("@/lib/gemini");
    const body = await safeJson(req);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { perspective, analysisText, holdings, history, message } = body;

    if (!perspective || !analysisText || !message) {
      return NextResponse.json({ error: "perspective, analysisText, and message required" }, { status: 400 });
    }

    const reply = await chatWithPerspective(
      perspective,
      analysisText,
      holdings ?? [],
      history ?? [],
      message
    );

    return NextResponse.json({ reply });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
