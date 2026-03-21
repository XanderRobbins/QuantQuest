export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-trade",
    name: "First Blood",
    description: "Made your first investment",
    icon: "Sword",
  },
  {
    id: "diversified",
    name: "Don't Put All Eggs",
    description: "Hold 3+ different assets",
    icon: "Layers",
  },
  {
    id: "big-spender",
    name: "Big Spender",
    description: "Invest $5,000+ in a single trade",
    icon: "Flame",
  },
  {
    id: "analyst",
    name: "Data Driven",
    description: "Run your first AI analysis",
    icon: "Brain",
  },
  {
    id: "bull-run",
    name: "Bull Run",
    description: "Portfolio value exceeds $12,000",
    icon: "TrendingUp",
  },
  {
    id: "quant",
    name: "Quant Mode",
    description: "Invest in a quantitative strategy",
    icon: "Zap",
  },
  {
    id: "safe-player",
    name: "Safety First",
    description: "Invest in a safe asset",
    icon: "Shield",
  },
  {
    id: "full-portfolio",
    name: "All In",
    description: "Invest in sectors, strategies, AND safeties",
    icon: "Trophy",
  },
  {
    id: "profit-taker",
    name: "Profit Taker",
    description: "Sell a position for the first time",
    icon: "ArrowDownToLine",
  },
  {
    id: "tenk-club",
    name: "10K Club",
    description: "Maintain portfolio value above $10,000",
    icon: "Award",
  },
];

export interface AchievementCheckState {
  holdings: { id: string; type: string; amount: number }[];
  totalValue: number;
  hasAnalyzed: boolean;
  hasSold: boolean;
  largestTrade: number;
  totalTrades: number;
}

export function checkAchievements(state: AchievementCheckState): string[] {
  const unlocked: string[] = [];

  const nonCashHoldings = state.holdings.filter(
    (h) => h.id !== "cash" && h.amount > 0
  );
  const types = new Set(nonCashHoldings.map((h) => h.type));

  // first-trade
  if (state.totalTrades >= 1) {
    unlocked.push("first-trade");
  }

  // diversified
  if (nonCashHoldings.length >= 3) {
    unlocked.push("diversified");
  }

  // big-spender
  if (state.largestTrade >= 5000) {
    unlocked.push("big-spender");
  }

  // analyst
  if (state.hasAnalyzed) {
    unlocked.push("analyst");
  }

  // bull-run
  if (state.totalValue > 12000) {
    unlocked.push("bull-run");
  }

  // quant
  if (nonCashHoldings.some((h) => h.type === "strategy")) {
    unlocked.push("quant");
  }

  // safe-player — non-cash safety holding
  if (nonCashHoldings.some((h) => h.type === "safety")) {
    unlocked.push("safe-player");
  }

  // full-portfolio
  if (types.has("sector") && types.has("strategy") && types.has("safety")) {
    unlocked.push("full-portfolio");
  }

  // profit-taker
  if (state.hasSold) {
    unlocked.push("profit-taker");
  }

  // tenk-club
  if (state.totalValue >= 10000) {
    unlocked.push("tenk-club");
  }

  return unlocked;
}
