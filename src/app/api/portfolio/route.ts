import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Portfolio } from "@/models/Portfolio";
import { User } from "@/models/User";
import { simulateReturns } from "@/lib/returns";

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

  // Simulate one day of returns if we haven't already today
  const today = new Date().toISOString().split("T")[0];
  const lastEntry = portfolio.history[portfolio.history.length - 1];

  if (!lastEntry || lastEntry.date !== today) {
    // Apply returns to holdings (uses live market data when available)
    await simulateReturns(portfolio.holdings);

    // Compute new total portfolio value
    const totalValue =
      Math.round(
        portfolio.holdings.reduce((sum: number, h: { amount: number }) => sum + h.amount, 0) * 100
      ) / 100;

    // Append today's history entry
    portfolio.history.push({ date: today, value: totalValue });

    // Persist changes
    portfolio.markModified("holdings");
    portfolio.markModified("history");
    await portfolio.save();
  }

  return NextResponse.json(portfolio);
}

// POST /api/portfolio — create or reset portfolio
export async function POST(req: NextRequest) {
  const body = await req.json();
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
