import { NextRequest, NextResponse } from "next/server";
import { XP_REWARDS, getLevel } from "@/lib/xp";
import { checkAchievements } from "@/lib/achievements";
import { safeJson } from "@/lib/utils";

// In-memory fallback when MongoDB is unavailable
const memoryProfiles = new Map<
  string,
  {
    userId: string;
    xp: number;
    achievements: string[];
    totalTrades: number;
    largestTrade: number;
    hasAnalyzed: boolean;
    hasSold: boolean;
  }
>();

function defaultProfile(userId: string) {
  return {
    userId,
    xp: 0,
    achievements: [] as string[],
    totalTrades: 0,
    largestTrade: 0,
    hasAnalyzed: false,
    hasSold: false,
  };
}

// GET /api/gamification?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { GameProfile } = await import("@/models/GameProfile");
    await connectDB();

    let profile = await GameProfile.findOne({ userId });
    if (!profile) {
      profile = await GameProfile.create({ userId });
    }

    return NextResponse.json({
      xp: profile.xp,
      level: getLevel(profile.xp),
      achievements: profile.achievements,
      totalTrades: profile.totalTrades,
      largestTrade: profile.largestTrade,
      hasAnalyzed: profile.hasAnalyzed,
      hasSold: profile.hasSold,
    });
  } catch {
    // Fallback to memory
    const profile = memoryProfiles.get(userId) ?? defaultProfile(userId);
    memoryProfiles.set(userId, profile);
    return NextResponse.json({
      xp: profile.xp,
      level: getLevel(profile.xp),
      achievements: profile.achievements,
      totalTrades: profile.totalTrades,
      largestTrade: profile.largestTrade,
      hasAnalyzed: profile.hasAnalyzed,
      hasSold: profile.hasSold,
    });
  }
}

// POST /api/gamification
export async function POST(req: NextRequest) {
  const body = await safeJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { userId, action, data } = body;

  if (!userId || !action) {
    return NextResponse.json(
      { error: "userId and action required" },
      { status: 400 }
    );
  }

  let profile: {
    userId: string;
    xp: number;
    achievements: string[];
    totalTrades: number;
    largestTrade: number;
    hasAnalyzed: boolean;
    hasSold: boolean;
  };

  let holdings: { id: string; type: string; amount: number }[] = [];
  let totalValue = 0;
  let useMongo = false;

  // Load profile + portfolio
  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { GameProfile } = await import("@/models/GameProfile");
    const { Portfolio } = await import("@/models/Portfolio");
    await connectDB();

    useMongo = true;

    let dbProfile = await GameProfile.findOne({ userId });
    if (!dbProfile) {
      dbProfile = await GameProfile.create({ userId });
    }

    profile = {
      userId: dbProfile.userId,
      xp: dbProfile.xp,
      achievements: [...dbProfile.achievements],
      totalTrades: dbProfile.totalTrades,
      largestTrade: dbProfile.largestTrade,
      hasAnalyzed: dbProfile.hasAnalyzed,
      hasSold: dbProfile.hasSold,
    };

    // Load portfolio for achievement checking
    const portfolio = await Portfolio.findOne({ userId });
    if (portfolio) {
      holdings = portfolio.holdings.map(
        (h: { id: string; type: string; amount: number }) => ({
          id: h.id,
          type: h.type,
          amount: h.amount,
        })
      );
      totalValue = holdings.reduce((sum, h) => sum + h.amount, 0);
    }
  } catch {
    // Fallback to memory
    profile = memoryProfiles.get(userId) ?? defaultProfile(userId);
  }

  // Apply XP based on action
  switch (action) {
    case "trade": {
      const amount = data?.amount ?? 0;
      const targetType = data?.targetType as string | undefined;

      // First investment bonus
      if (profile.totalTrades === 0) {
        profile.xp += XP_REWARDS.firstInvestment;
      }
      profile.xp += XP_REWARDS.eachInvestment;
      profile.totalTrades += 1;
      if (amount > profile.largestTrade) {
        profile.largestTrade = amount;
      }

      // Portfolio value milestones
      if (totalValue >= 11000) {
        profile.xp += XP_REWARDS.portfolioReaches11k;
      }
      if (totalValue >= 15000) {
        profile.xp += XP_REWARDS.portfolioReaches15k;
      }

      // Diversification check
      const nonCash = holdings.filter(
        (h) => h.id !== "cash" && h.amount > 0
      );
      if (nonCash.length >= 3) {
        profile.xp += XP_REWARDS.diversify3Holdings;
      }

      // Track target type for quant/safe achievements (data flows through holdings)
      void targetType;
      break;
    }
    case "analyze": {
      profile.xp += XP_REWARDS.runAnalysis;
      profile.hasAnalyzed = true;
      break;
    }
    case "sell": {
      if (!profile.hasSold) {
        profile.xp += XP_REWARDS.firstSell;
      }
      profile.hasSold = true;
      break;
    }
  }

  // Check achievements
  const allUnlocked = checkAchievements({
    holdings,
    totalValue,
    hasAnalyzed: profile.hasAnalyzed,
    hasSold: profile.hasSold,
    largestTrade: profile.largestTrade,
    totalTrades: profile.totalTrades,
  });

  const previousAchievements = new Set(profile.achievements);
  const newAchievements = allUnlocked.filter(
    (id) => !previousAchievements.has(id)
  );
  profile.achievements = [
    ...new Set([...profile.achievements, ...allUnlocked]),
  ];

  // Save
  if (useMongo) {
    try {
      const { GameProfile } = await import("@/models/GameProfile");
      await GameProfile.findOneAndUpdate(
        { userId },
        {
          xp: profile.xp,
          achievements: profile.achievements,
          totalTrades: profile.totalTrades,
          largestTrade: profile.largestTrade,
          hasAnalyzed: profile.hasAnalyzed,
          hasSold: profile.hasSold,
        },
        { upsert: true }
      );
    } catch {
      memoryProfiles.set(userId, profile);
    }
  } else {
    memoryProfiles.set(userId, profile);
  }

  return NextResponse.json({
    xp: profile.xp,
    level: getLevel(profile.xp),
    newAchievements,
    allAchievements: profile.achievements,
  });
}
