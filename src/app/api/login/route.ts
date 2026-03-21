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

  // Case-insensitive lookup
  const user = await User.findOne({
    username: { $regex: new RegExp(`^${username.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const portfolio = await Portfolio.findOne({ userId: user.userId });

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  return NextResponse.json({
    userId: user.userId,
    username: user.username,
    portfolio,
  });
}
