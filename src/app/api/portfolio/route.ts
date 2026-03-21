import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Portfolio } from "@/models/Portfolio";
import { User } from "@/models/User";

// GET /api/portfolio?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await connectDB();
  const portfolio = await Portfolio.findOne({ userId }).lean();

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
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

  // Generate 30 days of mock history
  const today = new Date();
  const history: { date: string; value: number }[] = [];
  let value = 10000;
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    value = value * (1 + (Math.random() - 0.48) * 0.03);
    history.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(value * 100) / 100,
    });
  }

  const portfolio = await Portfolio.create({
    userId,
    username,
    holdings: [{ id: "cash", type: "safety", amount: 10000 }],
    history,
  });

  return NextResponse.json(portfolio, { status: 201 });
}
