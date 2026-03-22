import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Portfolio } from "@/models/Portfolio";
import { Transaction } from "@/models/Transaction";

export async function GET() {
  await connectDB();

  // Get all userIds that have at least one verified Solana transaction
  const tradedUserIds: string[] = await Transaction.distinct("userId");

  if (tradedUserIds.length === 0) {
    // Fall back to all portfolios if no transactions yet
    const all = await Portfolio.find({}, { username: 1, history: 1, totalDeposited: 1 }).lean();
    return NextResponse.json(buildEntries(all, {}));
  }

  // Fetch portfolios for users who have traded
  const portfolios = await Portfolio.find(
    { userId: { $in: tradedUserIds } },
    { userId: 1, username: 1, history: 1, totalDeposited: 1 }
  ).lean();

  // Count trades per user for display
  const tradeCounts = await Transaction.aggregate([
    { $match: { userId: { $in: tradedUserIds } } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const countMap: Record<string, number> = {};
  for (const t of tradeCounts) countMap[t._id] = t.count;

  return NextResponse.json(buildEntries(portfolios, countMap));
}

function buildEntries(
  portfolios: { userId?: string; username: string; history: { date: string; value: number }[]; totalDeposited?: number }[],
  countMap: Record<string, number>
) {
  const entries = portfolios.map((p) => {
    const history = p.history ?? [];
    const last = history[history.length - 1]?.value ?? 0;
    const prev = history[history.length - 2]?.value ?? last;
    const costBasis = p.totalDeposited && p.totalDeposited > 0 ? p.totalDeposited : (history.find((h) => h.value > 0)?.value ?? last);

    const dailyChangePercent = prev > 0 ? ((last - prev) / prev) * 100 : 0;
    const allTimeChangePercent = costBasis > 0 ? ((last - costBasis) / costBasis) * 100 : 0;

    return {
      username: p.username,
      totalValue: last,
      dailyChangePercent,
      allTimeChangePercent,
      tradeCount: countMap[p.userId ?? ""] ?? 0,
    };
  });

  // Deduplicate by username (keep highest value)
  const seen = new Map<string, typeof entries[0]>();
  for (const e of entries) {
    const existing = seen.get(e.username);
    if (!existing || e.totalValue > existing.totalValue) seen.set(e.username, e);
  }

  const deduped = Array.from(seen.values());
  deduped.sort((a, b) => b.allTimeChangePercent - a.allTimeChangePercent);
  return deduped.slice(0, 15);
}
