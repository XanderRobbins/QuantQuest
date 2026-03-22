import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Portfolio } from "@/models/Portfolio";

// POST /api/login — find existing account by username
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username } = body;

  if (!username?.trim()) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  await connectDB();

  const escapedName = username.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRegex = new RegExp(`^${escapedName}$`, "i");

  // Try User model first, fall back to Portfolio lookup (covers seeded accounts)
  let userId: string;
  let resolvedUsername: string;

  const user = await User.findOne({ username: nameRegex });
  if (user) {
    userId = user.userId;
    resolvedUsername = user.username;
  } else {
    // Check if a Portfolio exists with this username (seeded accounts)
    const portfolio = await Portfolio.findOne({ username: nameRegex });
    if (!portfolio) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    userId = portfolio.userId;
    resolvedUsername = portfolio.username;
    // Backfill a User record so future logins use the normal path
    await User.findOneAndUpdate(
      { userId },
      { userId, username: resolvedUsername },
      { upsert: true }
    );
  }

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  return NextResponse.json({
    userId,
    username: resolvedUsername,
    portfolio,
  });
}
