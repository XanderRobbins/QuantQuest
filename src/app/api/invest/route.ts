import { NextRequest, NextResponse } from "next/server";
import { recordTradeOnChain, getExplorerUrl } from "@/lib/solana";

// In-memory portfolio store as fallback when MongoDB isn't configured
const portfolioStore: Record<string, {
  userId: string;
  username: string;
  holdings: { id: string; type: string; amount: number }[];
  history: { date: string; value: number }[];
}> = {};

// Shared helper to load portfolio from MongoDB or memory
async function loadPortfolio(userId: string) {
  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { Portfolio } = await import("@/models/Portfolio");
    await connectDB();
    return await Portfolio.findOne({ userId });
  } catch {
    return portfolioStore[userId] ?? null;
  }
}

// Shared helper to persist portfolio
async function persistPortfolio(portfolio: {
  userId: string;
  username: string;
  holdings: { id: string; type: string; amount: number }[];
  history: { date: string; value: number }[];
  save?: () => Promise<void>;
}) {
  if (portfolio.save) {
    await portfolio.save();
  } else {
    portfolioStore[portfolio.userId] = portfolio;
  }
}

// Shared helper to update history with current total
function updateHistory(portfolio: {
  holdings: { id: string; type: string; amount: number }[];
  history: { date: string; value: number }[];
}) {
  const totalValue = portfolio.holdings.reduce((sum, h) => sum + h.amount, 0);
  const today = new Date().toISOString().split("T")[0];
  const lastEntry = portfolio.history[portfolio.history.length - 1];
  if (lastEntry && lastEntry.date === today) {
    lastEntry.value = totalValue;
  } else {
    portfolio.history.push({ date: today, value: totalValue });
  }
}

// Shared helper to record trade on Solana and persist transaction
async function recordTrade(userId: string, targetId: string, targetType: string, amount: number, action: "buy" | "sell") {
  let solanaSignature: string | null = null;
  let explorerUrl: string | null = null;
  let solanaError: string | null = null;

  try {
    const timestamp = new Date().toISOString();
    solanaSignature = await recordTradeOnChain({
      userId,
      investment: `${action}:${targetId}`,
      type: targetType,
      amount,
      timestamp,
    });
    explorerUrl = getExplorerUrl(solanaSignature);

    try {
      const { connectDB } = await import("@/lib/mongodb");
      const { Transaction } = await import("@/models/Transaction");
      await connectDB();
      await Transaction.create({
        userId,
        investment: targetId,
        type: targetType,
        amount: action === "sell" ? -amount : amount,
        signature: solanaSignature,
        explorerUrl,
        timestamp: new Date(),
      });
    } catch {
      // MongoDB not available — transaction recorded on-chain regardless
    }
  } catch (err) {
    solanaError = err instanceof Error ? err.message : "Solana transaction failed";
  }

  return { solanaSignature, explorerUrl, solanaError };
}

// POST /api/invest — execute a buy
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, targetId, targetType, amount } = body;

  if (!userId || !targetId || !targetType || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "userId, targetId, targetType, and positive amount required" },
      { status: 400 }
    );
  }

  const portfolio = await loadPortfolio(userId);
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const cashHolding = portfolio.holdings.find((h: { id: string }) => h.id === "cash");
  if (!cashHolding || cashHolding.amount < amount) {
    return NextResponse.json({ error: "Insufficient cash" }, { status: 400 });
  }

  // Update holdings
  cashHolding.amount -= amount;
  const existing = portfolio.holdings.find((h: { id: string }) => h.id === targetId);
  if (existing) {
    existing.amount += amount;
  } else {
    portfolio.holdings.push({ id: targetId, type: targetType, amount });
  }

  updateHistory(portfolio);
  await persistPortfolio(portfolio);

  // Fire off Solana recording in the background — don't block the response
  recordTrade(userId, targetId, targetType, amount, "buy").catch(() => {});

  return NextResponse.json({
    ...portfolio.toObject ? portfolio.toObject() : portfolio,
  });
}

// DELETE /api/invest — sell a position (partially or fully)
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { userId, targetId, amount } = body;

  if (!userId || !targetId || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "userId, targetId, and positive amount required" },
      { status: 400 }
    );
  }

  const portfolio = await loadPortfolio(userId);
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const holding = portfolio.holdings.find((h: { id: string }) => h.id === targetId);
  if (!holding || holding.id === "cash") {
    return NextResponse.json({ error: "Holding not found" }, { status: 404 });
  }
  if (holding.amount < amount) {
    return NextResponse.json(
      { error: `Insufficient holding. You have ${holding.amount}` },
      { status: 400 }
    );
  }

  // Move funds back to cash
  holding.amount -= amount;
  const cashHolding = portfolio.holdings.find((h: { id: string }) => h.id === "cash");
  if (cashHolding) {
    cashHolding.amount += amount;
  }

  // Remove empty holdings
  portfolio.holdings = portfolio.holdings.filter(
    (h: { id: string; amount: number }) => h.id === "cash" || h.amount > 0
  );

  updateHistory(portfolio);
  await persistPortfolio(portfolio);

  // Fire off Solana recording in the background — don't block the response
  recordTrade(userId, targetId, holding.type, amount, "sell").catch(() => {});

  return NextResponse.json({
    ...portfolio.toObject ? portfolio.toObject() : portfolio,
  });
}
