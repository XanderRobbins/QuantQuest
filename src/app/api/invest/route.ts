import { NextRequest, NextResponse } from "next/server";
import { recordTradeOnChain, getExplorerUrl } from "@/lib/solana";

// In-memory portfolio store as fallback when MongoDB isn't configured
const portfolioStore: Record<string, {
  userId: string;
  username: string;
  holdings: { id: string; type: string; amount: number }[];
  history: { date: string; value: number }[];
}> = {};

// POST /api/invest — execute an investment
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, targetId, targetType, amount } = body;

  if (!userId || !targetId || !targetType || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "userId, targetId, targetType, and positive amount required" },
      { status: 400 }
    );
  }

  let portfolio: {
    userId: string;
    username: string;
    holdings: { id: string; type: string; amount: number }[];
    history: { date: string; value: number }[];
    save?: () => Promise<void>;
  } | null = null;

  // Try MongoDB first
  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { Portfolio } = await import("@/models/Portfolio");
    await connectDB();
    portfolio = await Portfolio.findOne({ userId });
  } catch {
    // MongoDB not configured — use memory store
    portfolio = portfolioStore[userId] ?? null;
  }

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const cashHolding = portfolio.holdings.find((h) => h.id === "cash");
  if (!cashHolding || cashHolding.amount < amount) {
    return NextResponse.json({ error: "Insufficient cash" }, { status: 400 });
  }

  // Update holdings
  cashHolding.amount -= amount;
  const existing = portfolio.holdings.find((h) => h.id === targetId);
  if (existing) {
    existing.amount += amount;
  } else {
    portfolio.holdings.push({ id: targetId, type: targetType, amount });
  }

  // Update history
  const totalValue = portfolio.holdings.reduce((sum, h) => sum + h.amount, 0);
  const today = new Date().toISOString().split("T")[0];
  const lastEntry = portfolio.history[portfolio.history.length - 1];
  if (lastEntry && lastEntry.date === today) {
    lastEntry.value = totalValue;
  } else {
    portfolio.history.push({ date: today, value: totalValue });
  }

  // Persist
  if (portfolio.save) {
    await portfolio.save();
  } else {
    portfolioStore[userId] = portfolio;
  }

  // Record trade on Solana devnet (non-blocking — don't fail the investment if this errors)
  let solanaSignature: string | null = null;
  let explorerUrl: string | null = null;
  try {
    const timestamp = new Date().toISOString();
    solanaSignature = await recordTradeOnChain({
      userId,
      investment: targetId,
      type: targetType,
      amount,
      timestamp,
    });
    explorerUrl = getExplorerUrl(solanaSignature);

    // Persist transaction record
    try {
      const { connectDB } = await import("@/lib/mongodb");
      const { Transaction } = await import("@/models/Transaction");
      await connectDB();
      await Transaction.create({
        userId,
        investment: targetId,
        type: targetType,
        amount,
        signature: solanaSignature,
        explorerUrl,
        timestamp: new Date(),
      });
    } catch {
      // MongoDB not available — transaction recorded on-chain regardless
    }
  } catch {
    // Solana errors are non-fatal
  }

  return NextResponse.json({
    ...portfolio,
    solana: solanaSignature ? { signature: solanaSignature, explorerUrl } : null,
  });
}
