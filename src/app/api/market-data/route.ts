import { NextResponse } from "next/server";
import { getMarketData } from "@/lib/market-data";

// GET /api/market-data — fetch live stock quotes for all sectors
export async function GET() {
  try {
    const data = await getMarketData();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch market data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
