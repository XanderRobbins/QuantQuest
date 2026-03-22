import { sectors } from "@/data/sectors";
import { strategies } from "@/data/strategies";
import { safeties } from "@/data/safeties";
import type { IHolding } from "@/models/Portfolio";
import { getLiveDailyChange } from "@/lib/market-data";

/** Daily noise amplitude by asset class — safeties are near-deterministic */
function getNoiseScale(holdingId: string): number {
  if (safeties.find((s) => s.id === holdingId)) return 0.0001; // ±0.01%
  if (strategies.find((s) => s.id === holdingId)) return 0.005; // ±0.5%
  return 0.01; // ±1% for sectors (equities)
}

/** Number of 1-minute intervals in a trading day (6.5 hours) */
const INTERVALS_PER_DAY = 390;

/**
 * Look up the annualized return for a holding and convert to a per-interval rate
 * (one interval = 1 minute). This is called every minute.
 * Sectors and strategies use return1Y (percentage), safeties use apy.
 */
export function getExpectedIntervalReturn(holdingId: string): number {
  const sector = sectors.find((s) => s.id === holdingId);
  if (sector) return sector.return1Y / 100 / 252 / INTERVALS_PER_DAY;

  const strategy = strategies.find((s) => s.id === holdingId);
  if (strategy) return strategy.return1Y / 100 / 252 / INTERVALS_PER_DAY;

  const safety = safeties.find((s) => s.id === holdingId);
  if (safety) return safety.apy / 100 / 365 / INTERVALS_PER_DAY;

  return 0;
}

/** @deprecated Use getExpectedIntervalReturn instead */
export function getExpectedDailyReturn(holdingId: string): number {
  return getExpectedIntervalReturn(holdingId) * INTERVALS_PER_DAY;
}

/**
 * Apply one interval (1 minute) of returns to every holding in the portfolio.
 * For sector holdings, attempts to use live Yahoo Finance data.
 * Falls back to expected interval return + noise if live data unavailable.
 *
 * Mutates `holdings` in place and returns the updated array.
 */
export async function simulateReturns(holdings: IHolding[]): Promise<IHolding[]> {
  const intervalNoiseScale = 1 / Math.sqrt(INTERVALS_PER_DAY); // Scale noise down for shorter intervals

  for (const holding of holdings) {
    if (holding.id === "cash") {
      const intervalReturn = getExpectedIntervalReturn(holding.id);
      holding.amount = holding.amount * (1 + intervalReturn);
    } else {
      // Try live market data for sector holdings
      let liveChange: number | null = null;
      try {
        liveChange = await getLiveDailyChange(holding.id);
      } catch {
        // Live data unavailable
      }

      if (liveChange !== null) {
        // Scale live daily change to a 1-min interval
        const intervalChange = liveChange / INTERVALS_PER_DAY;
        holding.amount = holding.amount * (1 + intervalChange);
      } else {
        // Fallback: expected interval return + scaled noise
        const expected = getExpectedIntervalReturn(holding.id);
        const noise = (Math.random() - 0.5) * getNoiseScale(holding.id) * intervalNoiseScale;
        holding.amount = holding.amount * (1 + expected + noise);
      }
    }

    holding.amount = Math.round(holding.amount * 100) / 100;
  }

  return holdings;
}
