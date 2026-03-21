import { NextRequest, NextResponse } from "next/server";
import { generateAnalysis } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
