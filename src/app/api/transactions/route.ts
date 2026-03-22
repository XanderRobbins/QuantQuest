import { NextRequest, NextResponse } from "next/server";
import { recordTradeOnChain, getExplorerUrl } from "@/lib/solana";
import { safeJson } from "@/lib/utils";

// In-memory store as fallback when MongoDB isn't configured
const memoryStore: {
  userId: string;
  investment: string;
  type: string;
  amount: number;
  signature: string;
  explorerUrl: string;
  timestamp: string;
}[] = [];

// POST /api/transactions — record a trade on Solana devnet
export async function POST(req: NextRequest) {
  const body = await safeJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { userId, investment, type, amount } = body;

  const timestamp = new Date().toISOString();

  try {
    const signature = await recordTradeOnChain({
      userId,
      investment,
      type,
      amount,
      timestamp,
    });

    const explorerUrl = getExplorerUrl(signature);

    const record = { userId, investment, type, amount, signature, explorerUrl, timestamp };

    // Try to persist to MongoDB if available
    try {
      const { connectDB } = await import("@/lib/mongodb");
      const { Transaction } = await import("@/models/Transaction");
      await connectDB();
      await Transaction.create({ ...record, timestamp: new Date(timestamp) });
    } catch {
      // MongoDB not configured — store in memory
      memoryStore.push(record);
    }

    return NextResponse.json({ signature, explorerUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/transactions?userId=xxx — fetch transaction history
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { Transaction } = await import("@/models/Transaction");
    await connectDB();
    const txs = await Transaction.find({ userId }).sort({ timestamp: -1 }).limit(20).lean();
    return NextResponse.json(txs);
  } catch {
    // Fall back to memory store
    const txs = memoryStore
      .filter((t) => t.userId === userId)
      .reverse()
      .slice(0, 20);
    return NextResponse.json(txs);
  }
}
