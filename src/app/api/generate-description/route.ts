import { NextRequest, NextResponse } from "next/server";
import { generateInvestmentDescription } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { name, type, existingDescription } = await req.json();

    const description = await generateInvestmentDescription(
      name,
      type,
      existingDescription
    );

    return NextResponse.json({ description });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
