import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Portfolio } from "@/models/Portfolio";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";

// Generates a monthly equity curve (fast) with realistic market regimes
function generateHistory(startDate: Date, startValue: number, profile: "aggressive" | "moderate" | "conservative" | "momentum" | "value") {
  const history: { date: string; value: number }[] = [];
  let value = startValue;
  const today = new Date();

  // Monthly drift & vol per profile
  const configs = {
    aggressive:   { drift: 0.012, vol: 0.055 },
    moderate:     { drift: 0.008, vol: 0.032 },
    conservative: { drift: 0.005, vol: 0.014 },
    momentum:     { drift: 0.015, vol: 0.065 },
    value:        { drift: 0.009, vol: 0.038 },
  };
  const { drift, vol } = configs[profile];

  let seed = startValue * 137 + profile.length * 31;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };
  const randn = () => { const u = rand(), v = rand(); return Math.sqrt(-2 * Math.log(u + 0.0001)) * Math.cos(2 * Math.PI * v); };

  const current = new Date(startDate);
  current.setDate(1); // snap to month start

  while (current <= today) {
    const y = current.getFullYear(), m = current.getMonth();
    let regime = 0;
    if (y === 2020 && m >= 1 && m <= 2) regime = -0.18;
    else if (y === 2020 && m >= 3)      regime = 0.06;
    else if (y === 2021)                regime = 0.025;
    else if (y === 2022)                regime = -0.04;
    else if (y === 2023)                regime = 0.02;
    else if (y >= 2024)                 regime = 0.022;

    const monthly = drift + regime + randn() * vol;
    value = Math.max(value * (1 + monthly), startValue * 0.25);
    history.push({ date: current.toISOString().split("T")[0], value: Math.round(value * 100) / 100 });
    current.setMonth(current.getMonth() + 1);
  }

  return history;
}

function fakeSignature(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let sig = "";
  let s = h;
  for (let i = 0; i < 87; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    sig += chars[s % chars.length];
  }
  return sig;
}

const ACCOUNTS = [
  {
    username: "TechBull",
    userId: "seed_techbull_001",
    profile: "aggressive" as const,
    startDate: "2019-06-15",
    startValue: 8000,
    deposits: 42000,
    holdings: [
      { id: "tech",         type: "sector",   amount: 18500 },
      { id: "ai-robotics",  type: "sector",   amount: 14200 },
      { id: "semiconductors", type: "sector", amount: 9800  },
      { id: "momentum",     type: "strategy", amount: 6500  },
      { id: "cash",         type: "safety",   amount: 1200  },
    ],
    trades: [
      { investment: "buy:tech",         type: "sector",   amount: 5000,  daysAgo: 2100 },
      { investment: "buy:ai-robotics",  type: "sector",   amount: 8000,  daysAgo: 1800 },
      { investment: "buy:semiconductors", type: "sector", amount: 4000,  daysAgo: 1500 },
      { investment: "buy:momentum",     type: "strategy", amount: 3000,  daysAgo: 1200 },
      { investment: "buy:tech",         type: "sector",   amount: 7000,  daysAgo: 900  },
      { investment: "sell:tech",        type: "sector",   amount: 2000,  daysAgo: 600  },
      { investment: "buy:ai-robotics",  type: "sector",   amount: 5000,  daysAgo: 400  },
      { investment: "buy:tech",         type: "sector",   amount: 3000,  daysAgo: 200  },
      { investment: "buy:semiconductors", type: "sector", amount: 2500,  daysAgo: 90   },
    ],
  },
  {
    username: "SafeHarbor",
    userId: "seed_safeharbor_002",
    profile: "conservative" as const,
    startDate: "2019-03-01",
    startValue: 25000,
    deposits: 85000,
    holdings: [
      { id: "treasury",       type: "safety",   amount: 28000 },
      { id: "hysa",           type: "safety",   amount: 22000 },
      { id: "money-market",   type: "safety",   amount: 18000 },
      { id: "tips",           type: "safety",   amount: 12000 },
      { id: "cd-ladder",      type: "safety",   amount: 8000  },
      { id: "risk-parity",    type: "strategy", amount: 5000  },
      { id: "cash",           type: "safety",   amount: 3200  },
    ],
    trades: [
      { investment: "buy:treasury",     type: "safety",   amount: 10000, daysAgo: 2200 },
      { investment: "buy:hysa",         type: "safety",   amount: 8000,  daysAgo: 1900 },
      { investment: "buy:money-market", type: "safety",   amount: 6000,  daysAgo: 1600 },
      { investment: "buy:tips",         type: "safety",   amount: 5000,  daysAgo: 1300 },
      { investment: "buy:risk-parity",  type: "strategy", amount: 3000,  daysAgo: 1000 },
      { investment: "buy:cd-ladder",    type: "safety",   amount: 4000,  daysAgo: 700  },
      { investment: "buy:treasury",     type: "safety",   amount: 5000,  daysAgo: 400  },
      { investment: "buy:hysa",         type: "safety",   amount: 3000,  daysAgo: 150  },
    ],
  },
  {
    username: "DiversifiedDave",
    userId: "seed_diversified_003",
    profile: "moderate" as const,
    startDate: "2019-09-10",
    startValue: 15000,
    deposits: 60000,
    holdings: [
      { id: "tech",           type: "sector",   amount: 9000  },
      { id: "healthcare",     type: "sector",   amount: 7000  },
      { id: "finance",        type: "sector",   amount: 6500  },
      { id: "real-estate",    type: "sector",   amount: 5000  },
      { id: "smart-beta",     type: "strategy", amount: 8000  },
      { id: "dca",            type: "strategy", amount: 6000  },
      { id: "treasury",       type: "safety",   amount: 8000  },
      { id: "low-vol",        type: "safety",   amount: 5500  },
      { id: "cash",           type: "safety",   amount: 2200  },
    ],
    trades: [
      { investment: "buy:tech",        type: "sector",   amount: 5000,  daysAgo: 2050 },
      { investment: "buy:healthcare",  type: "sector",   amount: 4000,  daysAgo: 1750 },
      { investment: "buy:smart-beta",  type: "strategy", amount: 4000,  daysAgo: 1450 },
      { investment: "buy:finance",     type: "sector",   amount: 3000,  daysAgo: 1150 },
      { investment: "buy:dca",         type: "strategy", amount: 3000,  daysAgo: 850  },
      { investment: "buy:treasury",    type: "safety",   amount: 4000,  daysAgo: 600  },
      { investment: "buy:real-estate", type: "sector",   amount: 3000,  daysAgo: 400  },
      { investment: "buy:low-vol",     type: "safety",   amount: 3000,  daysAgo: 200  },
      { investment: "buy:tech",        type: "sector",   amount: 3000,  daysAgo: 60   },
    ],
  },
  {
    username: "MomentumKing",
    userId: "seed_momentum_004",
    profile: "momentum" as const,
    startDate: "2020-01-15",
    startValue: 10000,
    deposits: 38000,
    holdings: [
      { id: "momentum",       type: "strategy", amount: 16000 },
      { id: "trend-following",type: "strategy", amount: 11000 },
      { id: "breakout-trading",type:"strategy", amount: 8000  },
      { id: "faang",          type: "sector",   amount: 7500  },
      { id: "semiconductors", type: "sector",   amount: 5000  },
      { id: "cash",           type: "safety",   amount: 1800  },
    ],
    trades: [
      { investment: "buy:momentum",        type: "strategy", amount: 5000, daysAgo: 2200 },
      { investment: "buy:faang",           type: "sector",   amount: 4000, daysAgo: 1900 },
      { investment: "buy:trend-following", type: "strategy", amount: 5000, daysAgo: 1600 },
      { investment: "buy:breakout-trading",type: "strategy", amount: 4000, daysAgo: 1300 },
      { investment: "sell:faang",          type: "sector",   amount: 2000, daysAgo: 1000 },
      { investment: "buy:semiconductors",  type: "sector",   amount: 3000, daysAgo: 700  },
      { investment: "buy:momentum",        type: "strategy", amount: 4000, daysAgo: 450  },
      { investment: "buy:faang",           type: "sector",   amount: 3500, daysAgo: 200  },
      { investment: "buy:trend-following", type: "strategy", amount: 3000, daysAgo: 60   },
    ],
  },
  {
    username: "ValueVault",
    userId: "seed_value_005",
    profile: "value" as const,
    startDate: "2019-05-20",
    startValue: 20000,
    deposits: 72000,
    holdings: [
      { id: "factor-value",   type: "strategy", amount: 18000 },
      { id: "dividend-growth",type: "strategy", amount: 14000 },
      { id: "finance",        type: "sector",   amount: 10000 },
      { id: "consumer-staples",type:"sector",   amount: 8000  },
      { id: "industrials",    type: "sector",   amount: 7000  },
      { id: "utilities",      type: "sector",   amount: 6000  },
      { id: "short-term-bonds",type:"safety",   amount: 8000  },
      { id: "cash",           type: "safety",   amount: 2800  },
    ],
    trades: [
      { investment: "buy:factor-value",    type: "strategy", amount: 8000, daysAgo: 2400 },
      { investment: "buy:finance",         type: "sector",   amount: 5000, daysAgo: 2100 },
      { investment: "buy:dividend-growth", type: "strategy", amount: 6000, daysAgo: 1800 },
      { investment: "buy:consumer-staples",type: "sector",   amount: 4000, daysAgo: 1500 },
      { investment: "buy:industrials",     type: "sector",   amount: 4000, daysAgo: 1200 },
      { investment: "buy:utilities",       type: "sector",   amount: 3000, daysAgo: 900  },
      { investment: "buy:short-term-bonds",type: "safety",   amount: 4000, daysAgo: 600  },
      { investment: "buy:factor-value",    type: "strategy", amount: 5000, daysAgo: 300  },
      { investment: "buy:dividend-growth", type: "strategy", amount: 4000, daysAgo: 100  },
    ],
  },
  {
    username: "RocketRita",
    userId: "seed_rocket_006",
    profile: "aggressive" as const,
    startDate: "2020-04-01",
    startValue: 5000,
    deposits: 28000,
    holdings: [
      { id: "ai-robotics",    type: "sector",   amount: 12000 },
      { id: "semiconductors", type: "sector",   amount: 9000  },
      { id: "cybersecurity",  type: "sector",   amount: 7000  },
      { id: "faang",          type: "sector",   amount: 6500  },
      { id: "momentum",       type: "strategy", amount: 5000  },
      { id: "cash",           type: "safety",   amount: 900   },
    ],
    trades: [
      { investment: "buy:faang",          type: "sector",   amount: 3000, daysAgo: 2100 },
      { investment: "buy:semiconductors", type: "sector",   amount: 4000, daysAgo: 1800 },
      { investment: "buy:ai-robotics",    type: "sector",   amount: 5000, daysAgo: 1500 },
      { investment: "buy:cybersecurity",  type: "sector",   amount: 4000, daysAgo: 1200 },
      { investment: "buy:momentum",       type: "strategy", amount: 3000, daysAgo: 900  },
      { investment: "buy:ai-robotics",    type: "sector",   amount: 4000, daysAgo: 600  },
      { investment: "buy:semiconductors", type: "sector",   amount: 3000, daysAgo: 300  },
      { investment: "buy:faang",          type: "sector",   amount: 2500, daysAgo: 90   },
    ],
  },
  {
    username: "QuantQueen",
    userId: "seed_quant_007",
    profile: "moderate" as const,
    startDate: "2019-11-01",
    startValue: 30000,
    deposits: 95000,
    holdings: [
      { id: "stat-arb",       type: "strategy", amount: 22000 },
      { id: "pairs-trading",  type: "strategy", amount: 18000 },
      { id: "market-neutral", type: "strategy", amount: 15000 },
      { id: "volatility-harvesting", type: "strategy", amount: 12000 },
      { id: "smart-beta",     type: "strategy", amount: 10000 },
      { id: "treasury",       type: "safety",   amount: 12000 },
      { id: "cash",           type: "safety",   amount: 4500  },
    ],
    trades: [
      { investment: "buy:stat-arb",      type: "strategy", amount: 8000,  daysAgo: 2300 },
      { investment: "buy:pairs-trading", type: "strategy", amount: 7000,  daysAgo: 2000 },
      { investment: "buy:market-neutral",type: "strategy", amount: 6000,  daysAgo: 1700 },
      { investment: "buy:smart-beta",    type: "strategy", amount: 5000,  daysAgo: 1400 },
      { investment: "buy:volatility-harvesting",type:"strategy",amount:6000,daysAgo:1100},
      { investment: "buy:treasury",      type: "safety",   amount: 6000,  daysAgo: 800  },
      { investment: "buy:stat-arb",      type: "strategy", amount: 6000,  daysAgo: 500  },
      { investment: "buy:pairs-trading", type: "strategy", amount: 5000,  daysAgo: 250  },
      { investment: "buy:market-neutral",type: "strategy", amount: 5000,  daysAgo: 80   },
    ],
  },
  {
    username: "GrowthGuru",
    userId: "seed_growth_008",
    profile: "aggressive" as const,
    startDate: "2019-07-04",
    startValue: 12000,
    deposits: 50000,
    holdings: [
      { id: "tech",             type: "sector",   amount: 14000 },
      { id: "biotech",          type: "sector",   amount: 10000 },
      { id: "clean-energy",     type: "sector",   amount: 8000  },
      { id: "fintech",          type: "sector",   amount: 7500  },
      { id: "gaming-esports",   type: "sector",   amount: 6000  },
      { id: "trend-following",  type: "strategy", amount: 8000  },
      { id: "hysa",             type: "safety",   amount: 6000  },
      { id: "cash",             type: "safety",   amount: 1800  },
    ],
    trades: [
      { investment: "buy:tech",           type: "sector",   amount: 5000, daysAgo: 2400 },
      { investment: "buy:biotech",        type: "sector",   amount: 4000, daysAgo: 2100 },
      { investment: "buy:clean-energy",   type: "sector",   amount: 4000, daysAgo: 1800 },
      { investment: "buy:fintech",        type: "sector",   amount: 4000, daysAgo: 1500 },
      { investment: "buy:trend-following",type: "strategy", amount: 4000, daysAgo: 1200 },
      { investment: "buy:gaming-esports", type: "sector",   amount: 3000, daysAgo: 900  },
      { investment: "buy:tech",           type: "sector",   amount: 4000, daysAgo: 600  },
      { investment: "buy:biotech",        type: "sector",   amount: 3500, daysAgo: 300  },
      { investment: "buy:fintech",        type: "sector",   amount: 2500, daysAgo: 70   },
    ],
  },
  {
    username: "SteadyEddie",
    userId: "seed_steady_009",
    profile: "conservative" as const,
    startDate: "2018-12-01",
    startValue: 50000,
    deposits: 150000,
    holdings: [
      { id: "consumer-staples",type: "sector",   amount: 25000 },
      { id: "utilities",       type: "sector",   amount: 20000 },
      { id: "real-estate",     type: "sector",   amount: 18000 },
      { id: "dividend-growth", type: "strategy", amount: 22000 },
      { id: "risk-parity",     type: "strategy", amount: 18000 },
      { id: "treasury",        type: "safety",   amount: 20000 },
      { id: "tips",            type: "safety",   amount: 15000 },
      { id: "muni-bonds",      type: "safety",   amount: 12000 },
      { id: "cash",            type: "safety",   amount: 5500  },
    ],
    trades: [
      { investment: "buy:consumer-staples",type:"sector",  amount: 10000, daysAgo: 2700 },
      { investment: "buy:treasury",        type: "safety", amount: 8000,  daysAgo: 2400 },
      { investment: "buy:dividend-growth", type: "strategy",amount:8000,  daysAgo: 2100 },
      { investment: "buy:utilities",       type: "sector", amount: 7000,  daysAgo: 1800 },
      { investment: "buy:risk-parity",     type: "strategy",amount:6000,  daysAgo: 1500 },
      { investment: "buy:real-estate",     type: "sector", amount: 6000,  daysAgo: 1200 },
      { investment: "buy:tips",            type: "safety", amount: 6000,  daysAgo: 900  },
      { investment: "buy:muni-bonds",      type: "safety", amount: 5000,  daysAgo: 600  },
      { investment: "buy:dividend-growth", type: "strategy",amount:5000,  daysAgo: 300  },
      { investment: "buy:consumer-staples",type:"sector",  amount: 5000,  daysAgo: 90   },
    ],
  },
  {
    username: "SectorSwapper",
    userId: "seed_sector_010",
    profile: "moderate" as const,
    startDate: "2020-06-01",
    startValue: 7500,
    deposits: 32000,
    holdings: [
      { id: "sector-rotation",  type: "strategy", amount: 12000 },
      { id: "communication-services", type: "sector", amount: 8000 },
      { id: "aerospace-defense",type: "sector",   amount: 7000  },
      { id: "materials",        type: "sector",   amount: 5000  },
      { id: "industrials",      type: "sector",   amount: 5500  },
      { id: "smart-beta",       type: "strategy", amount: 5000  },
      { id: "stable-value",     type: "safety",   amount: 5000  },
      { id: "cash",             type: "safety",   amount: 1800  },
    ],
    trades: [
      { investment: "buy:sector-rotation",  type: "strategy", amount: 4000, daysAgo: 2000 },
      { investment: "buy:communication-services",type:"sector",amount: 3500, daysAgo: 1700 },
      { investment: "buy:aerospace-defense",type: "sector",   amount: 3500, daysAgo: 1400 },
      { investment: "buy:smart-beta",       type: "strategy", amount: 3000, daysAgo: 1100 },
      { investment: "buy:materials",        type: "sector",   amount: 2500, daysAgo: 800  },
      { investment: "buy:industrials",      type: "sector",   amount: 2500, daysAgo: 600  },
      { investment: "buy:stable-value",     type: "safety",   amount: 2500, daysAgo: 400  },
      { investment: "buy:sector-rotation",  type: "strategy", amount: 3000, daysAgo: 200  },
      { investment: "buy:aerospace-defense",type: "sector",   amount: 2500, daysAgo: 60   },
    ],
  },
];

export async function GET(req: NextRequest) {
  await connectDB();

  const force = req.nextUrl.searchParams.get("force") === "true";
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  let created = 0;
  let skipped = 0;

  const results = await Promise.all(ACCOUNTS.map(async (account) => {
    const existing = await Portfolio.findOne({ userId: account.userId });
    if (existing && !force) return "skipped";

    if (existing && force) {
      await Portfolio.deleteOne({ userId: account.userId });
      await Transaction.deleteMany({ userId: account.userId });
      await User.deleteOne({ userId: account.userId });
    }

    const history = generateHistory(new Date(account.startDate), account.startValue, account.profile);
    const holdingsTotal = account.holdings.reduce((s, h) => s + h.amount, 0);
    // Add today's entry so the GET route's new-day logic doesn't fire on first load
    if (history[history.length - 1]?.date !== todayStr) {
      history.push({ date: todayStr, value: Math.round(holdingsTotal * 100) / 100 });
    }
    const baseline: Record<string, number> = {};
    for (const h of account.holdings) baseline[h.id] = h.amount;

    await Portfolio.create({
      userId: account.userId,
      username: account.username,
      holdings: account.holdings,
      history,
      dailyBaseline: baseline,
      baselineDate: now.toISOString().split("T")[0],
      totalDeposited: account.deposits,
      baselineDeposited: account.deposits,
    });

    const txDocs = account.trades.map((t, i) => {
      const ts = new Date(now);
      ts.setDate(ts.getDate() - t.daysAgo);
      const sig = fakeSignature(`${account.userId}-${t.investment}-${i}`);
      return {
        userId: account.userId,
        investment: t.investment,
        type: t.type,
        amount: t.amount,
        signature: sig,
        explorerUrl: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
        timestamp: ts,
      };
    });

    await Transaction.insertMany(txDocs);
    return "created";
  }));

  created = results.filter((r) => r === "created").length;
  skipped = results.filter((r) => r === "skipped").length;

  return NextResponse.json({
    message: `Seed complete — ${created} accounts created, ${skipped} already existed.${force ? " (force mode)" : ""}`,
    accounts: ACCOUNTS.map((a) => a.username),
  });
}
