import { NextRequest, NextResponse } from "next/server";
import { snowflakeQuery, isSnowflakeConfigured } from "@/lib/snowflake";
import { safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export interface AdvancedMetrics {
  // Returns
  totalReturn: number;
  annualizedReturn: number;
  bestDay: number;
  worstDay: number;
  // Risk
  volatility: number;
  maxDrawdown: number;
  winRate: number;
  var95: number;
  // Ratios
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  // Meta
  tradingDays: number;
  computedBy: "snowflake" | "local";
}

function computeLocally(history: { date: string; value: number }[], totalDeposited?: number): AdvancedMetrics {
  const nonZero = history.filter((h) => h.value > 0);
  if (nonZero.length < 2) {
    return {
      totalReturn: 0, annualizedReturn: 0, bestDay: 0, worstDay: 0,
      volatility: 0, maxDrawdown: 0, winRate: 0, var95: 0,
      sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0,
      tradingDays: 0, computedBy: "local",
    };
  }

  const returns: number[] = [];
  for (let i = 1; i < nonZero.length; i++) {
    const r = (nonZero[i].value - nonZero[i - 1].value) / nonZero[i - 1].value;
    returns.push(r);
  }

  const n = returns.length;
  const meanR = returns.reduce((s, r) => s + r, 0) / n;
  const variance = returns.reduce((s, r) => s + (r - meanR) ** 2, 0) / n;
  const stdR = Math.sqrt(variance);

  const negReturns = returns.filter((r) => r < 0);
  const downsideVariance = negReturns.reduce((s, r) => s + r ** 2, 0) / Math.max(n, 1);
  const downsideStd = Math.sqrt(downsideVariance);

  const winRate = returns.filter((r) => r > 0).length / n;

  // Max drawdown
  let peak = nonZero[0].value;
  let maxDD = 0;
  for (const h of nonZero) {
    if (h.value > peak) peak = h.value;
    const dd = (h.value - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  const endVal = nonZero[nonZero.length - 1].value;
  const costBasis = totalDeposited && totalDeposited > 0 ? totalDeposited : nonZero[0].value;
  const totalReturn = (endVal - costBasis) / costBasis;
  const annualizedReturn = Math.pow(1 + totalReturn, 252 / n) - 1;

  // Filter out deposit-day spikes: cap daily returns at 20% to exclude artificial jumps from deposits
  const filteredReturns = returns.filter((r) => Math.abs(r) < 0.2);
  const bestDay = filteredReturns.length > 0 ? Math.max(...filteredReturns) : Math.max(...returns);
  const worstDay = filteredReturns.length > 0 ? Math.min(...filteredReturns) : Math.min(...returns);

  const RF = 0.05 / 252; // daily risk-free rate ~5% annual
  const sharpeRatio = stdR > 0 ? ((meanR - RF) / stdR) * Math.sqrt(252) : 0;
  const sortinoRatio = downsideStd > 0 ? ((meanR - RF) / downsideStd) * Math.sqrt(252) : 0;
  const calmarRatio = maxDD < 0 ? annualizedReturn / Math.abs(maxDD) : 0;
  const var95 = meanR - 1.645 * stdR;

  return {
    totalReturn,
    annualizedReturn,
    bestDay,
    worstDay,
    volatility: stdR * Math.sqrt(252),
    maxDrawdown: maxDD,
    winRate,
    var95,
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    tradingDays: n,
    computedBy: "local",
  };
}

async function computeViaSnowflake(
  history: { date: string; value: number }[],
  totalDeposited?: number
): Promise<AdvancedMetrics> {
  const nonZero = history.filter((h) => h.value > 0);
  if (nonZero.length < 2) throw new Error("Not enough data");

  const values = nonZero
    .map((h) => `('${h.date}', ${h.value.toFixed(4)})`)
    .join(",\n  ");

  const sql = `
WITH raw AS (
  SELECT $1::DATE AS dt, $2::FLOAT AS val
  FROM VALUES
    ${values}
),
ordered AS (
  SELECT dt, val,
    LAG(val) OVER (ORDER BY dt) AS prev_val,
    MAX(val) OVER (ORDER BY dt ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_peak
  FROM raw
),
returns AS (
  SELECT dt, val, running_peak,
    (val - prev_val) / NULLIF(prev_val, 0) AS ret
  FROM ordered
  WHERE prev_val IS NOT NULL AND prev_val > 0
),
agg AS (
  SELECT
    COUNT(*) AS n,
    AVG(ret) AS avg_ret,
    STDDEV_POP(ret) AS std_ret,
    MAX(CASE WHEN ABS(ret) < 0.2 THEN ret ELSE NULL END) AS best_day,
    MIN(CASE WHEN ABS(ret) < 0.2 THEN ret ELSE NULL END) AS worst_day,
    SUM(CASE WHEN ret > 0 THEN 1 ELSE 0 END)::FLOAT / COUNT(*) AS win_rate,
    STDDEV_POP(CASE WHEN ret < 0 THEN ret ELSE NULL END) AS downside_std,
    MIN((val - running_peak) / NULLIF(running_peak, 0)) AS max_drawdown
  FROM returns
)
SELECT
  n AS trading_days,
  avg_ret,
  std_ret,
  best_day,
  worst_day,
  win_rate,
  downside_std,
  max_drawdown,
  CASE WHEN std_ret > 0
    THEN ((avg_ret - 0.05/252) / std_ret) * SQRT(252)
    ELSE 0
  END AS sharpe_ratio,
  CASE WHEN downside_std > 0
    THEN ((avg_ret - 0.05/252) / downside_std) * SQRT(252)
    ELSE 0
  END AS sortino_ratio,
  avg_ret - 1.645 * std_ret AS var_95
FROM agg
`;

  type Row = {
    TRADING_DAYS: number;
    AVG_RET: number;
    STD_RET: number;
    BEST_DAY: number;
    WORST_DAY: number;
    WIN_RATE: number;
    DOWNSIDE_STD: number;
    MAX_DRAWDOWN: number;
    SHARPE_RATIO: number;
    SORTINO_RATIO: number;
    VAR_95: number;
  };

  const rows = await snowflakeQuery<Row>(sql);
  const r = rows[0];

  const n = r.TRADING_DAYS;
  const endVal = nonZero[nonZero.length - 1].value;
  const costBasis = totalDeposited && totalDeposited > 0 ? totalDeposited : nonZero[0].value;
  const totalReturn = (endVal - costBasis) / costBasis;
  const annualizedReturn = Math.pow(1 + totalReturn, 252 / n) - 1;
  const maxDD = r.MAX_DRAWDOWN ?? 0;
  const calmarRatio = maxDD < 0 ? annualizedReturn / Math.abs(maxDD) : 0;

  return {
    totalReturn,
    annualizedReturn,
    bestDay: r.BEST_DAY,
    worstDay: r.WORST_DAY,
    volatility: r.STD_RET * Math.sqrt(252),
    maxDrawdown: maxDD,
    winRate: r.WIN_RATE,
    var95: r.VAR_95,
    sharpeRatio: r.SHARPE_RATIO,
    sortinoRatio: r.SORTINO_RATIO,
    calmarRatio,
    tradingDays: n,
    computedBy: "snowflake",
  };
}

export async function POST(req: NextRequest) {
  const body = await safeJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const history: { date: string; value: number }[] = (body.history as { date: string; value: number }[]) ?? [];
  const totalDeposited: number | undefined = body.totalDeposited as number | undefined;

  if (isSnowflakeConfigured()) {
    try {
      const metrics = await computeViaSnowflake(history, totalDeposited);
      return NextResponse.json(metrics);
    } catch (err) {
      console.error("Snowflake error, falling back to local:", err);
    }
  }

  const metrics = computeLocally(history, totalDeposited);
  return NextResponse.json(metrics);
}
