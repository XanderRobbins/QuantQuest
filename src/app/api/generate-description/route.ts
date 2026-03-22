import { NextRequest, NextResponse } from "next/server";
import { generateInvestmentDescription, explainInvestment } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, existingDescription, mode } = body;

    if (mode === "explain") {
      const explanation = await explainInvestment(name, type, existingDescription);
      return NextResponse.json({ description: explanation });
    }

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
