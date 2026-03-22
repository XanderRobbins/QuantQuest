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

/**
 * Look up the annualized return for a holding and convert to a daily rate.
 * Sectors and strategies use return1Y (percentage), safeties use apy.
 */
export function getExpectedDailyReturn(holdingId: string): number {
  const sector = sectors.find((s) => s.id === holdingId);
  if (sector) return sector.return1Y / 100 / 252;

  const strategy = strategies.find((s) => s.id === holdingId);
  if (strategy) return strategy.return1Y / 100 / 252;

  const safety = safeties.find((s) => s.id === holdingId);
  if (safety) return safety.apy / 100 / 365;

  return 0;
}

/**
 * Apply one day of returns to every holding in the portfolio.
 * For sector holdings, attempts to use live Yahoo Finance data.
 * Falls back to expected daily return + noise if live data unavailable.
 *
 * Mutates `holdings` in place and returns the updated array.
 */
export async function simulateReturns(holdings: IHolding[]): Promise<IHolding[]> {
  for (const holding of holdings) {
    if (holding.id === "cash") {
      const dailyReturn = getExpectedDailyReturn(holding.id);
      holding.amount = holding.amount * (1 + dailyReturn);
    } else {
      // Try live market data for sector holdings
      let dailyReturn: number | null = null;
      try {
        dailyReturn = await getLiveDailyChange(holding.id);
      } catch {
        // Live data unavailable
      }

      if (dailyReturn !== null) {
        // Use real market daily change
        holding.amount = holding.amount * (1 + dailyReturn);
      } else {
        // Fallback: expected return + noise scaled to asset type
        const expected = getExpectedDailyReturn(holding.id);
        const noise = (Math.random() - 0.5) * getNoiseScale(holding.id);
        holding.amount = holding.amount * (1 + expected + noise);
      }
    }

    holding.amount = Math.round(holding.amount * 100) / 100;
  }

  return holdings;
}
