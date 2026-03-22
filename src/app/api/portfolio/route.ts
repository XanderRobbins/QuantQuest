import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Portfolio } from "@/models/Portfolio";
import { User } from "@/models/User";
import { simulateReturns } from "@/lib/returns";
import { getLiveDailyChange } from "@/lib/market-data";
import { safeJson } from "@/lib/utils";

// GET /api/portfolio?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await connectDB();
  const portfolio = await Portfolio.findOne({ userId });

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const lastEntry = portfolio.history[portfolio.history.length - 1];
  const ONE_MIN = 60 * 1000;

  // Check if 1 minute has passed since last simulation
  const lastSim = portfolio.lastSimulatedAt ? new Date(portfolio.lastSimulatedAt).getTime() : 0;
  const shouldSimulate = (now.getTime() - lastSim) >= ONE_MIN;
  const isNewDay = !lastEntry || lastEntry.date !== today;

  if (shouldSimulate) {
    // Apply returns to holdings (uses live market data when available)
    await simulateReturns(portfolio.holdings);
    portfolio.lastSimulatedAt = now;

    // On new day: snapshot baseline for intraday calculations
    if (isNewDay) {
      const baseline: Record<string, number> = {};
      for (const h of portfolio.holdings) {
        baseline[h.id] = h.amount;
      }
      portfolio.dailyBaseline = baseline;
      portfolio.baselineDate = today;
      portfolio.baselineDeposited = portfolio.totalDeposited ?? 0;
      portfolio.markModified("dailyBaseline");
    }

    const totalValue =
      Math.round(
        portfolio.holdings.reduce((sum: number, h: { amount: number }) => sum + h.amount, 0) * 100
      ) / 100;

    if (isNewDay) {
      portfolio.history.push({ date: today, value: totalValue });
    } else if (lastEntry) {
      lastEntry.value = totalValue;
    }

    portfolio.markModified("holdings");
    portfolio.markModified("history");
    await portfolio.save();
  }

  // Build live-adjusted holdings for the response (not saved to DB)
  // For sector holdings: displayAmount = dayOpenBaseline * (1 + current live daily change %)
  // This is accurate and non-compounding regardless of how often the page is refreshed.
  const baseline =
    portfolio.baselineDate === today && portfolio.dailyBaseline
      ? (portfolio.dailyBaseline as Record<string, number>)
      : null;

  const liveHoldingsPromises = portfolio.holdings.map(async (h: { id: string; type: string; amount: number }) => {
    if (baseline && h.type === "sector" && baseline[h.id] !== undefined) {
      try {
        const liveChange = await getLiveDailyChange(h.id);
        if (liveChange !== null) {
          return {
            id: h.id,
            type: h.type,
            amount: Math.round(baseline[h.id] * (1 + liveChange) * 100) / 100,
          };
        }
      } catch {
        // fall through to stored value
      }
    }
    return { id: h.id, type: h.type, amount: h.amount };
  });

  const liveHoldings = await Promise.all(liveHoldingsPromises);

  const portfolioObj = portfolio.toObject();
  portfolioObj.holdings = liveHoldings;

  // Update the most recent history entry with the live total for chart accuracy
  const liveTotal =
    Math.round(liveHoldings.reduce((s, h) => s + h.amount, 0) * 100) / 100;
  if (portfolioObj.history.length > 0) {
    portfolioObj.history[portfolioObj.history.length - 1].value = liveTotal;

    // Persist the live total so other consumers (leaderboard, analytics) see it too
    const dbHistory = portfolio.history;
    if (dbHistory.length > 0) {
      dbHistory[dbHistory.length - 1].value = liveTotal;
      portfolio.markModified("history");
      await portfolio.save();
    }
  }

  // Migration: seed totalDeposited for accounts that predate the field
  if (!portfolioObj.totalDeposited && liveTotal > 0) {
    portfolioObj.totalDeposited = liveTotal;
    portfolioObj.baselineDeposited = liveTotal;
    portfolio.totalDeposited = liveTotal;
    portfolio.baselineDeposited = liveTotal;
    await portfolio.save();
  }

  return NextResponse.json(portfolioObj);
}

// POST /api/portfolio — create or reset portfolio
export async function POST(req: NextRequest) {
  const body = await safeJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { userId, username } = body;

  if (!userId || !username) {
    return NextResponse.json(
      { error: "userId and username required" },
      { status: 400 }
    );
  }

  await connectDB();

  // Upsert user
  await User.findOneAndUpdate(
    { userId },
    { userId, username },
    { upsert: true }
  );

  // Check if portfolio exists
  const existing = await Portfolio.findOne({ userId });
  if (existing) {
    return NextResponse.json(existing);
  }

  // Start with $0 — user must transfer from Capital One bank account
  const today = new Date();
  const history: { date: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    history.push({
      date: date.toISOString().split("T")[0],
      value: 0,
    });
  }

  const portfolio = await Portfolio.create({
    userId,
    username,
    holdings: [{ id: "cash", type: "safety", amount: 0 }],
    history,
  });

  return NextResponse.json(portfolio, { status: 201 });
}
