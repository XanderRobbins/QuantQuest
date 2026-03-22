import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 503 }
    );
  }

  try {
    const { generateAnalysis } = await import("@/lib/gemini");
    const body = await safeJson(req);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    const { totalValue, allocation, holdings } = body;

    const analysis = await generateAnalysis({
      totalValue,
      allocation,
      holdings,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
