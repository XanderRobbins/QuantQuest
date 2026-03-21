import YahooFinance from "yahoo-finance2";
import { sectors } from "@/data/sectors";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// Cache market data for 15 minutes to avoid hammering Yahoo Finance
let cache: { data: MarketData; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

export interface StockQuote {
  symbol: string;
  price: number;
  changePercent: number; // daily change %
}

export interface SectorReturns {
  id: string;
  returnYTD: number;
  return1Y: number;
  stocks: StockQuote[];
}

export interface MarketData {
  sectors: Record<string, SectorReturns>;
  updatedAt: string;
}

// Collect all unique symbols from sectors
function getAllSymbols(): string[] {
  const symbolSet = new Set<string>();
  for (const sector of sectors) {
    for (const stock of sector.stocks) {
      symbolSet.add(stock.symbol);
    }
  }
  return Array.from(symbolSet);
}

// Fetch quotes for all symbols
async function fetchQuotes(
  symbols: string[]
): Promise<Record<string, StockQuote>> {
  const result: Record<string, StockQuote> = {};

  // Fetch in parallel batches
  const promises = symbols.map(async (symbol) => {
    try {
      const quote = await yahooFinance.quote(symbol) as Record<string, unknown>;
      result[symbol] = {
        symbol,
        price: (quote.regularMarketPrice as number) ?? 0,
        changePercent: (quote.regularMarketChangePercent as number) ?? 0,
      };
    } catch {
      // Skip failed symbols
    }
  });

  await Promise.all(promises);
  return result;
}

export async function getMarketData(): Promise<MarketData> {
  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const symbols = getAllSymbols();
  const quotes = await fetchQuotes(symbols);

  const sectorReturns: Record<string, SectorReturns> = {};

  for (const sector of sectors) {
    const stocks = sector.stocks
      .map((s) => quotes[s.symbol])
      .filter(Boolean);

    sectorReturns[sector.id] = {
      id: sector.id,
      returnYTD: sector.returnYTD, // keep static for now (would need historical data for real YTD)
      return1Y: sector.return1Y, // same
      stocks,
    };
  }

  const data: MarketData = {
    sectors: sectorReturns,
    updatedAt: new Date().toISOString(),
  };

  cache = { data, timestamp: Date.now() };
  return data;
}

// Get live daily change for a specific holding
export async function getLiveDailyChange(
  holdingId: string
): Promise<number | null> {
  const sector = sectors.find((s) => s.id === holdingId);
  if (!sector) return null;

  try {
    const data = await getMarketData();
    const sectorData = data.sectors[holdingId];
    if (!sectorData || sectorData.stocks.length === 0) return null;

    // Calculate weighted daily return
    let weightedReturn = 0;
    let totalWeight = 0;
    for (const stockDef of sector.stocks) {
      const liveStock = sectorData.stocks.find(
        (s) => s.symbol === stockDef.symbol
      );
      if (liveStock) {
        weightedReturn +=
          (stockDef.weight / 100) * (liveStock.changePercent / 100);
        totalWeight += stockDef.weight / 100;
      }
    }

    return totalWeight > 0 ? weightedReturn / totalWeight : null;
  } catch {
    return null;
  }
}
