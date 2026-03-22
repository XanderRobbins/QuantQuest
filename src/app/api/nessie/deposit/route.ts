import { NextRequest, NextResponse } from "next/server";
import { createWithdrawal } from "@/lib/nessie";
import { safeJson } from "@/lib/utils";

// POST /api/nessie/deposit — record an investment as a Nessie withdrawal (funds leaving account to invest)
export async function POST(req: NextRequest) {
  const body = await safeJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { accountId, amount, description } = body;

  if (!accountId || !amount) {
    return NextResponse.json({ error: "accountId and amount required" }, { status: 400 });
  }

  if (!process.env.NESSIE_API_KEY) {
    return NextResponse.json({ error: "NESSIE_API_KEY not configured" }, { status: 503 });
  }

  try {
    await createWithdrawal(accountId, amount, description ?? "QuantQuest investment");
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
