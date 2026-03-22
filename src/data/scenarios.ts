// ─── Historical Market Scenarios ──────────────────────────────────────────────
// Each scenario defines category-level returns (%) for 4 timeframes.
// A helper maps every asset ID to a category so we can compute results.

export type Timeframe = "1w" | "1m" | "3m" | "2y";

export interface HistoricalScenario {
  id: string;
  name: string;
  tagline: string;
  description: string;
  period: string;
  year: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  color: string;
  gradient: string;
  availableTimeframes: Timeframe[];
  keyEvents: string[];
  returns: Record<Timeframe, Record<string, number>>;
}

// ─── Category mapping ────────────────────────────────────────────────────────

const assetCategory: Record<string, string> = {
  // Sectors
  tech: "techGrowth",
  semiconductors: "techGrowth",
  "ai-robotics": "techGrowth",
  fintech: "techGrowth",
  cybersecurity: "techGrowth",
  faang: "techGrowth",
  finance: "finance",
  energy: "energy",
  "clean-energy": "energy",
  healthcare: "healthcare",
  biotech: "healthcare",
  "consumer-staples": "consumerDef",
  utilities: "consumerDef",
  "consumer-discretionary": "consumerCyc",
  "gaming-esports": "consumerCyc",
  industrials: "industrial",
  "aerospace-defense": "industrial",
  materials: "industrial",
  "communication-services": "commServices",
  "real-estate": "realEstate",
  // Strategies
  momentum: "stratAggressive",
  "breakout-trading": "stratAggressive",
  "stat-arb": "stratAggressive",
  "mean-reversion": "stratModerate",
  "trend-following": "stratModerate",
  "sector-rotation": "stratModerate",
  "pairs-trading": "stratModerate",
  "factor-value": "stratModerate",
  "smart-beta": "stratModerate",
  "volatility-harvesting": "stratModerate",
  "options-wheel": "stratModerate",
  "risk-parity": "stratDefensive",
  dca: "stratDefensive",
  "dividend-growth": "stratDefensive",
  "market-neutral": "stratDefensive",
  // Safeties
  treasury: "safety",
  hysa: "safety",
  "low-vol": "safety",
  cash: "cash",
  "money-market": "safety",
  "short-term-bonds": "safety",
  tips: "safety",
  "muni-bonds": "safety",
  "stable-value": "safety",
  "cd-ladder": "safety",
};

export function getAssetCategory(assetId: string): string {
  return assetCategory[assetId] ?? "industrial";
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

export const scenarios: HistoricalScenario[] = [
  {
    id: "covid-crash",
    name: "COVID-19 Crash",
    tagline: "The fastest bear market in history",
    description:
      "In February 2020, markets plunged as COVID-19 spread globally. The S&P 500 fell 34% in just 23 trading days — then staged a historic recovery fueled by unprecedented stimulus.",
    period: "Feb 19 – Apr 2020",
    year: 2020,
    difficulty: "Medium",
    color: "#ef4444",
    gradient: "from-red-500 to-orange-500",
    availableTimeframes: ["1w", "1m", "3m", "2y"],
    keyEvents: [
      "Feb 24: First major sell-off as cases surge outside China",
      "Mar 9: Oil price war triggers circuit breakers",
      "Mar 16: Fed cuts rates to zero",
      "Mar 23: Market bottom — S&P at 2,237",
      "Apr 9: Fed announces $2.3T in lending programs",
    ],
    returns: {
      "1w": {
        techGrowth: -12, finance: -15, energy: -20, healthcare: -8,
        consumerDef: -5, consumerCyc: -15, industrial: -14, commServices: -10,
        realEstate: -12, stratAggressive: -18, stratModerate: -10, stratDefensive: -5,
        safety: 0.5, cash: 0.01,
      },
      "1m": {
        techGrowth: -25, finance: -32, energy: -50, healthcare: -15,
        consumerDef: -10, consumerCyc: -30, industrial: -28, commServices: -18,
        realEstate: -25, stratAggressive: -35, stratModerate: -15, stratDefensive: -8,
        safety: 1.2, cash: 0.04,
      },
      "3m": {
        techGrowth: 5, finance: -15, energy: -35, healthcare: 8,
        consumerDef: 2, consumerCyc: -5, industrial: -10, commServices: 3,
        realEstate: -15, stratAggressive: -5, stratModerate: 0, stratDefensive: 2,
        safety: 1.5, cash: 0.1,
      },
      "2y": {
        techGrowth: 85, finance: 30, energy: -5, healthcare: 45,
        consumerDef: 20, consumerCyc: 55, industrial: 35, commServices: 70,
        realEstate: 25, stratAggressive: 60, stratModerate: 30, stratDefensive: 15,
        safety: 2.5, cash: 0.5,
      },
    },
  },
  {
    id: "2008-financial-crisis",
    name: "2008 Financial Crisis",
    tagline: "When the banks collapsed",
    description:
      "The collapse of Lehman Brothers in September 2008 triggered a global financial meltdown. Housing markets crashed, banks failed, and the S&P 500 lost over 50% from peak to trough.",
    period: "Sep 15 – Nov 2008",
    year: 2008,
    difficulty: "Hard",
    color: "#dc2626",
    gradient: "from-red-600 to-red-900",
    availableTimeframes: ["1w", "1m", "3m", "2y"],
    keyEvents: [
      "Sep 15: Lehman Brothers files bankruptcy",
      "Sep 16: AIG receives $85B bailout",
      "Sep 29: TARP rejected — Dow drops 778 points",
      "Oct 3: $700B TARP signed into law",
      "Nov 20: S&P 500 hits 12-year low at 752",
    ],
    returns: {
      "1w": {
        techGrowth: -15, finance: -25, energy: -12, healthcare: -8,
        consumerDef: -5, consumerCyc: -18, industrial: -16, commServices: -12,
        realEstate: -20, stratAggressive: -22, stratModerate: -12, stratDefensive: -6,
        safety: 1.0, cash: 0.02,
      },
      "1m": {
        techGrowth: -28, finance: -42, energy: -30, healthcare: -15,
        consumerDef: -10, consumerCyc: -35, industrial: -30, commServices: -22,
        realEstate: -35, stratAggressive: -40, stratModerate: -20, stratDefensive: -10,
        safety: 1.5, cash: 0.04,
      },
      "3m": {
        techGrowth: -40, finance: -55, energy: -48, healthcare: -25,
        consumerDef: -15, consumerCyc: -45, industrial: -42, commServices: -35,
        realEstate: -50, stratAggressive: -50, stratModerate: -28, stratDefensive: -12,
        safety: 2.0, cash: 0.1,
      },
      "2y": {
        techGrowth: -20, finance: -35, energy: -30, healthcare: -8,
        consumerDef: -5, consumerCyc: -25, industrial: -22, commServices: -18,
        realEstate: -30, stratAggressive: -30, stratModerate: -15, stratDefensive: -5,
        safety: 5.0, cash: 0.5,
      },
    },
  },
  {
    id: "dotcom-bubble",
    name: "Dot-com Bubble",
    tagline: "When the internet hype burst",
    description:
      "The dot-com bubble peaked in March 2000 and burst spectacularly. The NASDAQ lost 78% of its value over the next two years. Companies with no revenue but sky-high valuations vanished overnight.",
    period: "Mar 10, 2000",
    year: 2000,
    difficulty: "Expert",
    color: "#7c3aed",
    gradient: "from-violet-600 to-purple-900",
    availableTimeframes: ["1w", "1m", "3m", "2y"],
    keyEvents: [
      "Mar 10: NASDAQ peaks at 5,048",
      "Mar 20: First major tech sell-off begins",
      "Apr 14: NASDAQ drops 9.7% in one day",
      "Dec 2000: NASDAQ down 50% from peak",
      "Oct 2002: NASDAQ bottoms at 1,108 (−78%)",
    ],
    returns: {
      "1w": {
        techGrowth: -8, finance: -3, energy: 1, healthcare: -2,
        consumerDef: 0, consumerCyc: -5, industrial: -3, commServices: -6,
        realEstate: -1, stratAggressive: -10, stratModerate: -4, stratDefensive: -1,
        safety: 0.3, cash: 0.02,
      },
      "1m": {
        techGrowth: -25, finance: -5, energy: 3, healthcare: -5,
        consumerDef: 1, consumerCyc: -12, industrial: -6, commServices: -18,
        realEstate: -2, stratAggressive: -28, stratModerate: -8, stratDefensive: -2,
        safety: 0.8, cash: 0.04,
      },
      "3m": {
        techGrowth: -40, finance: -10, energy: 5, healthcare: -8,
        consumerDef: 2, consumerCyc: -20, industrial: -10, commServices: -30,
        realEstate: -3, stratAggressive: -42, stratModerate: -12, stratDefensive: -3,
        safety: 1.5, cash: 0.1,
      },
      "2y": {
        techGrowth: -70, finance: -15, energy: 10, healthcare: -5,
        consumerDef: 5, consumerCyc: -30, industrial: -15, commServices: -55,
        realEstate: 5, stratAggressive: -65, stratModerate: -18, stratDefensive: -5,
        safety: 8.0, cash: 0.8,
      },
    },
  },
  {
    id: "post-covid-rally",
    name: "Post-COVID Rally",
    tagline: "The greatest bull run of a generation",
    description:
      "From the March 2020 bottom, markets staged an extraordinary rally. Stimulus checks, zero interest rates, and the rise of retail trading on Robinhood sent stocks — especially tech — to record highs.",
    period: "Mar 23, 2020 onward",
    year: 2020,
    difficulty: "Easy",
    color: "#22c55e",
    gradient: "from-emerald-500 to-green-600",
    availableTimeframes: ["1w", "1m", "3m", "2y"],
    keyEvents: [
      "Mar 23: Market bottom — the buying begins",
      "Apr 2020: $1,200 stimulus checks arrive",
      "Jun 8: S&P 500 erases COVID losses",
      "Jan 2021: GameStop short squeeze goes viral",
      "Nov 2021: S&P 500 hits all-time high of 4,796",
    ],
    returns: {
      "1w": {
        techGrowth: 8, finance: 5, energy: 10, healthcare: 4,
        consumerDef: 2, consumerCyc: 7, industrial: 6, commServices: 5,
        realEstate: 4, stratAggressive: 10, stratModerate: 5, stratDefensive: 3,
        safety: -0.1, cash: 0.01,
      },
      "1m": {
        techGrowth: 20, finance: 12, energy: 25, healthcare: 10,
        consumerDef: 5, consumerCyc: 18, industrial: 15, commServices: 14,
        realEstate: 10, stratAggressive: 22, stratModerate: 12, stratDefensive: 6,
        safety: -0.2, cash: 0.04,
      },
      "3m": {
        techGrowth: 45, finance: 28, energy: 35, healthcare: 22,
        consumerDef: 10, consumerCyc: 40, industrial: 30, commServices: 35,
        realEstate: 20, stratAggressive: 48, stratModerate: 25, stratDefensive: 12,
        safety: -0.3, cash: 0.1,
      },
      "2y": {
        techGrowth: 110, finance: 65, energy: 85, healthcare: 55,
        consumerDef: 22, consumerCyc: 90, industrial: 50, commServices: 80,
        realEstate: 40, stratAggressive: 100, stratModerate: 45, stratDefensive: 20,
        safety: 0.5, cash: 0.5,
      },
    },
  },
  {
    id: "black-monday",
    name: "Black Monday",
    tagline: "22% in a single day",
    description:
      "On October 19, 1987, the Dow Jones dropped 22.6% — the largest single-day percentage decline in history. Program trading and portfolio insurance amplified a wave of panic selling that swept global markets.",
    period: "Oct 19, 1987",
    year: 1987,
    difficulty: "Hard",
    color: "#1e293b",
    gradient: "from-slate-700 to-slate-900",
    availableTimeframes: ["1w", "1m", "3m", "2y"],
    keyEvents: [
      "Oct 14: Dow drops 95 points on trade deficit fears",
      "Oct 16: Dow falls another 108 points (Friday)",
      "Oct 19: BLACK MONDAY — Dow plunges 508 points (−22.6%)",
      "Oct 20: Fed floods markets with liquidity",
      "Dec 1987: Markets stabilize, recovery begins",
    ],
    returns: {
      "1w": {
        techGrowth: -22, finance: -20, energy: -18, healthcare: -16,
        consumerDef: -15, consumerCyc: -24, industrial: -20, commServices: -18,
        realEstate: -15, stratAggressive: -25, stratModerate: -18, stratDefensive: -10,
        safety: 2.0, cash: 0.02,
      },
      "1m": {
        techGrowth: -15, finance: -14, energy: -12, healthcare: -10,
        consumerDef: -8, consumerCyc: -16, industrial: -14, commServices: -12,
        realEstate: -10, stratAggressive: -18, stratModerate: -10, stratDefensive: -5,
        safety: 2.5, cash: 0.04,
      },
      "3m": {
        techGrowth: -5, finance: -3, energy: -2, healthcare: 0,
        consumerDef: 2, consumerCyc: -5, industrial: -3, commServices: -2,
        realEstate: 0, stratAggressive: -6, stratModerate: -2, stratDefensive: 2,
        safety: 3.0, cash: 0.1,
      },
      "2y": {
        techGrowth: 25, finance: 20, energy: 15, healthcare: 30,
        consumerDef: 18, consumerCyc: 22, industrial: 20, commServices: 18,
        realEstate: 15, stratAggressive: 28, stratModerate: 18, stratDefensive: 12,
        safety: 8.0, cash: 0.8,
      },
    },
  },
  {
    id: "2022-bear",
    name: "2022 Bear Market",
    tagline: "Inflation, rate hikes, and tech wreck",
    description:
      "After years of near-zero rates, the Fed embarked on its most aggressive rate-hiking cycle in decades. Growth stocks were crushed, crypto collapsed, and the 60/40 portfolio had its worst year ever.",
    period: "Jan – Oct 2022",
    year: 2022,
    difficulty: "Medium",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
    availableTimeframes: ["1w", "1m", "3m", "2y"],
    keyEvents: [
      "Jan 2022: Fed signals aggressive rate hikes",
      "May: LUNA/Terra stablecoin collapses",
      "Jun 13: S&P enters official bear market",
      "Sep: Fed raises rates to 3.0–3.25%",
      "Oct 13: CPI comes in hot, market bounces off lows",
    ],
    returns: {
      "1w": {
        techGrowth: -5, finance: -2, energy: 3, healthcare: -2,
        consumerDef: -1, consumerCyc: -6, industrial: -3, commServices: -4,
        realEstate: -4, stratAggressive: -7, stratModerate: -3, stratDefensive: -1,
        safety: 0.2, cash: 0.02,
      },
      "1m": {
        techGrowth: -15, finance: -6, energy: 8, healthcare: -5,
        consumerDef: -2, consumerCyc: -18, industrial: -8, commServices: -12,
        realEstate: -10, stratAggressive: -18, stratModerate: -6, stratDefensive: -2,
        safety: 0.5, cash: 0.04,
      },
      "3m": {
        techGrowth: -28, finance: -12, energy: 15, healthcare: -10,
        consumerDef: -5, consumerCyc: -30, industrial: -15, commServices: -25,
        realEstate: -18, stratAggressive: -30, stratModerate: -12, stratDefensive: -4,
        safety: 1.0, cash: 0.1,
      },
      "2y": {
        techGrowth: -8, finance: 5, energy: 25, healthcare: 5,
        consumerDef: 3, consumerCyc: -12, industrial: 8, commServices: -5,
        realEstate: -10, stratAggressive: -10, stratModerate: 2, stratDefensive: 5,
        safety: 4.0, cash: 0.8,
      },
    },
  },
];

/**
 * Get the return (%) for a specific asset in a specific scenario + timeframe.
 */
export function getScenarioReturn(
  scenarioId: string,
  timeframe: Timeframe,
  assetId: string
): number {
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) return 0;

  const tf = scenario.returns[timeframe];
  if (!tf) return 0;

  const category = getAssetCategory(assetId);
  return tf[category] ?? 0;
}

/**
 * Compute the final portfolio value given an allocation and scenario.
 * allocation: array of { assetId, amount } where amounts sum to startingCash.
 */
export function computeHistoricalResult(
  scenarioId: string,
  timeframe: Timeframe,
  allocation: { assetId: string; amount: number }[],
  startingCash = 10000
): { finalValue: number; returnPct: number } {
  let finalValue = 0;

  for (const entry of allocation) {
    const returnPct = getScenarioReturn(scenarioId, timeframe, entry.assetId);
    finalValue += entry.amount * (1 + returnPct / 100);
  }

  finalValue = Math.round(finalValue * 100) / 100;
  const returnPct =
    Math.round(((finalValue - startingCash) / startingCash) * 10000) / 100;

  return { finalValue, returnPct };
}

/** Timeframe display labels */
export const timeframeLabels: Record<Timeframe, string> = {
  "1w": "1 Week",
  "1m": "1 Month",
  "3m": "3 Months",
  "2y": "2 Years",
};

// ─── Daily Curve Generation ──────────────────────────────────────────────────
// Trajectory shapes define how returns progress over time.
// Each shape is an array of [dayFraction, progressFraction] control points.
// progressFraction = how much of the final return has been realized at that point.
// Values > 1.0 mean the market overshoots before settling to the final return.

type Shape = [number, number][];

const shapes: Record<string, Shape> = {
  rapidFront: [[0, 0], [0.1, 0.35], [0.25, 0.7], [0.4, 0.9], [0.6, 0.97], [0.8, 0.99], [1, 1]],
  gradual:    [[0, 0], [0.25, 0.25], [0.5, 0.5], [0.75, 0.75], [1, 1]],
  overshoot:  [[0, 0], [0.15, 0.35], [0.35, 0.8], [0.5, 1.3], [0.65, 1.15], [0.8, 1.05], [1, 1]],
  slowStart:  [[0, 0], [0.3, 0.08], [0.5, 0.2], [0.7, 0.55], [0.85, 0.82], [1, 1]],
  spike:      [[0, 0], [0.05, 0.6], [0.15, 0.85], [0.3, 0.7], [0.5, 0.8], [0.75, 0.9], [1, 1]],
};

// Per-scenario, per-category shape assignments
const scenarioShapes: Record<string, Record<string, string>> = {
  "covid-crash": {
    techGrowth: "overshoot", finance: "overshoot", energy: "rapidFront",
    healthcare: "gradual", consumerDef: "gradual", consumerCyc: "overshoot",
    industrial: "overshoot", commServices: "gradual", realEstate: "overshoot",
    stratAggressive: "overshoot", stratModerate: "gradual", stratDefensive: "slowStart",
    safety: "gradual", cash: "gradual",
  },
  "2008-financial-crisis": {
    techGrowth: "slowStart", finance: "rapidFront", energy: "slowStart",
    healthcare: "gradual", consumerDef: "gradual", consumerCyc: "slowStart",
    industrial: "slowStart", commServices: "gradual", realEstate: "rapidFront",
    stratAggressive: "rapidFront", stratModerate: "gradual", stratDefensive: "slowStart",
    safety: "gradual", cash: "gradual",
  },
  "dotcom-bubble": {
    techGrowth: "slowStart", finance: "gradual", energy: "gradual",
    healthcare: "gradual", consumerDef: "gradual", consumerCyc: "slowStart",
    industrial: "gradual", commServices: "slowStart", realEstate: "gradual",
    stratAggressive: "slowStart", stratModerate: "gradual", stratDefensive: "gradual",
    safety: "gradual", cash: "gradual",
  },
  "post-covid-rally": {
    techGrowth: "rapidFront", finance: "slowStart", energy: "spike",
    healthcare: "gradual", consumerDef: "slowStart", consumerCyc: "rapidFront",
    industrial: "gradual", commServices: "rapidFront", realEstate: "slowStart",
    stratAggressive: "rapidFront", stratModerate: "gradual", stratDefensive: "slowStart",
    safety: "gradual", cash: "gradual",
  },
  "black-monday": {
    techGrowth: "spike", finance: "spike", energy: "spike",
    healthcare: "spike", consumerDef: "spike", consumerCyc: "spike",
    industrial: "spike", commServices: "spike", realEstate: "spike",
    stratAggressive: "spike", stratModerate: "spike", stratDefensive: "spike",
    safety: "gradual", cash: "gradual",
  },
  "2022-bear": {
    techGrowth: "slowStart", finance: "gradual", energy: "overshoot",
    healthcare: "gradual", consumerDef: "gradual", consumerCyc: "slowStart",
    industrial: "gradual", commServices: "slowStart", realEstate: "gradual",
    stratAggressive: "slowStart", stratModerate: "gradual", stratDefensive: "gradual",
    safety: "gradual", cash: "gradual",
  },
};

function interpolateShape(shape: Shape, t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  for (let i = 1; i < shape.length; i++) {
    if (t <= shape[i][0]) {
      const [t0, v0] = shape[i - 1];
      const [t1, v1] = shape[i];
      const local = (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * local;
    }
  }
  return 1;
}

/** Number of competition (trading) days per timeframe */
export const COMP_DAYS: Record<Timeframe, number> = { "1w": 7, "1m": 30, "3m": 90, "2y": 365 };

const CHART_POINTS: Record<Timeframe, number> = { "1w": 7, "1m": 30, "3m": 30, "2y": 52 };

/**
 * Get the daily price multiplier for an asset on a specific simulation day.
 * This is the ratio of (cumulative factor on day d) / (cumulative factor on day d−1).
 * Applying this multiplier to a holding's current amount advances it by one day.
 */
export function getDayMultiplier(
  scenarioId: string,
  timeframe: Timeframe,
  assetId: string,
  day: number,
  totalDays: number
): number {
  const totalReturn = getScenarioReturn(scenarioId, timeframe, assetId) / 100;
  if (totalReturn === 0 || totalDays === 0) return 1;

  const category = getAssetCategory(assetId);
  const scShapes = scenarioShapes[scenarioId] ?? {};
  const shapeName = scShapes[category] ?? "gradual";
  const shape = shapes[shapeName] ?? shapes.gradual;

  const prevFrac = Math.max(0, (day - 1) / totalDays);
  const currFrac = day / totalDays;

  const prevCum = 1 + totalReturn * interpolateShape(shape, prevFrac);
  const currCum = 1 + totalReturn * interpolateShape(shape, currFrac);

  return prevCum !== 0 ? currCum / prevCum : 1;
}

/**
 * Generate a daily value curve for a participant's allocation in a historical scenario.
 * Returns an array of { day, value } points suitable for charting.
 * Different allocations produce different curve shapes because each asset category
 * has its own trajectory — this makes participant curves cross and diverge.
 */
export function generateDailyCurve(
  scenarioId: string,
  timeframe: Timeframe,
  allocation: { assetId: string; amount: number }[],
  totalDaysOverride?: number
): { day: number; value: number }[] {
  const totalDays = totalDaysOverride ?? COMP_DAYS[timeframe];
  const chartPoints = CHART_POINTS[timeframe];
  const step = Math.max(1, Math.floor(totalDays / chartPoints));
  const scShapes = scenarioShapes[scenarioId] ?? {};

  const points: { day: number; value: number }[] = [];

  for (let d = 0; d <= totalDays; d += step) {
    const dayFrac = d / totalDays;
    let totalValue = 0;

    for (const entry of allocation) {
      const category = getAssetCategory(entry.assetId);
      const finalReturn = getScenarioReturn(scenarioId, timeframe, entry.assetId) / 100;
      const shapeName = scShapes[category] ?? "gradual";
      const shape = shapes[shapeName] ?? shapes.gradual;
      const progress = interpolateShape(shape, dayFrac);
      totalValue += entry.amount * (1 + finalReturn * progress);
    }

    points.push({ day: d, value: Math.round(totalValue * 100) / 100 });
  }

  // Ensure last point is exactly the final value
  const last = points[points.length - 1];
  if (last.day !== totalDays) {
    let finalValue = 0;
    for (const entry of allocation) {
      const finalReturn = getScenarioReturn(scenarioId, timeframe, entry.assetId) / 100;
      finalValue += entry.amount * (1 + finalReturn);
    }
    points.push({ day: totalDays, value: Math.round(finalValue * 100) / 100 });
  }

  return points;
}
