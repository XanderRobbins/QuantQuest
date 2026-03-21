export interface Strategy {
  id: string;
  name: string;
  description: string;
  howItWorks: string;
  risk: "Low" | "Medium" | "High";
  returnYTD: number;
  return1Y: number;
  color: string;
}

export const strategies: Strategy[] = [
  {
    id: "momentum",
    name: "Momentum",
    description:
      "Buy stocks that have been going up, sell stocks that have been going down. Rides market trends for outsized gains.",
    howItWorks:
      "Ranks stocks by their past 6-12 month returns and buys the top performers while avoiding the losers. Rebalances monthly.",
    risk: "High",
    returnYTD: 15.7,
    return1Y: 22.4,
    color: "#f97316",
  },
  {
    id: "mean-reversion",
    name: "Mean Reversion",
    description:
      "Buy stocks that have fallen sharply, expecting them to bounce back to their average price. Contrarian value approach.",
    howItWorks:
      "Identifies stocks trading significantly below their 50-day moving average and buys them, selling when they revert to the mean.",
    risk: "Medium",
    returnYTD: 7.3,
    return1Y: 12.8,
    color: "#14b8a6",
  },
  {
    id: "risk-parity",
    name: "Risk Parity",
    description:
      "Allocates capital so that each asset contributes equally to portfolio risk. Balances stocks, bonds, and commodities.",
    howItWorks:
      "Instead of splitting by dollar amount, it equalizes risk contribution. Higher-volatility assets get less capital, lower-volatility assets get more.",
    risk: "Low",
    returnYTD: 4.2,
    return1Y: 8.6,
    color: "#3b82f6",
  },
  {
    id: "dca",
    name: "Dollar-Cost Averaging",
    description:
      "Invest a fixed amount at regular intervals regardless of market price. Removes emotion and timing risk from investing.",
    howItWorks:
      "Automatically invests a set dollar amount into a diversified index weekly. Buys more shares when prices are low and fewer when prices are high.",
    risk: "Low",
    returnYTD: 6.1,
    return1Y: 10.4,
    color: "#22c55e",
  },
  {
    id: "factor-value",
    name: "Value Factor",
    description:
      "Targets undervalued companies with strong fundamentals — low P/E ratios, high book value, and solid cash flows.",
    howItWorks:
      "Screens for stocks with low price-to-earnings, price-to-book, and high free cash flow yield. Rebalances quarterly to capture value premium.",
    risk: "Medium",
    returnYTD: 9.5,
    return1Y: 14.1,
    color: "#a855f7",
  },
  {
    id: "pairs-trading",
    name: "Pairs Trading",
    description:
      "Simultaneously long one stock and short a correlated peer when their price ratio diverges. Profits from convergence regardless of market direction.",
    howItWorks:
      "Identifies historically correlated stock pairs (e.g., Coke/Pepsi). When the spread widens beyond 2 standard deviations, goes long the laggard and short the leader.",
    risk: "Medium",
    returnYTD: 5.8,
    return1Y: 11.3,
    color: "#ec4899",
  },
  {
    id: "stat-arb",
    name: "Statistical Arbitrage",
    description:
      "Uses quantitative models to exploit short-term mispricings across hundreds of securities. Market-neutral with consistent returns.",
    howItWorks:
      "Builds a portfolio of long and short positions based on statistical models analyzing price, volume, and factor exposures. Holds positions for days to weeks.",
    risk: "Medium",
    returnYTD: 8.9,
    return1Y: 16.2,
    color: "#6366f1",
  },
  {
    id: "trend-following",
    name: "Trend Following",
    description:
      "Systematic strategy that goes long in uptrends and short in downtrends across multiple asset classes. Thrives in volatile markets.",
    howItWorks:
      "Uses moving average crossovers and breakout signals to determine trend direction. Applies position sizing based on volatility to manage risk.",
    risk: "High",
    returnYTD: 12.4,
    return1Y: 19.7,
    color: "#f43f5e",
  },
  {
    id: "volatility-harvesting",
    name: "Volatility Harvesting",
    description:
      "Systematically sells options premium to capture the gap between implied and realized volatility. Generates steady income in calm markets.",
    howItWorks:
      "Sells short-dated put and call options on broad indices when implied volatility is elevated. Manages risk through position sizing and rolling strategies.",
    risk: "Medium",
    returnYTD: 6.7,
    return1Y: 13.5,
    color: "#eab308",
  },
  {
    id: "smart-beta",
    name: "Smart Beta",
    description:
      "Rules-based strategy combining multiple factors — value, quality, momentum, and low volatility — for enhanced risk-adjusted returns.",
    howItWorks:
      "Weights stocks by factor scores rather than market cap. Tilts toward cheap, profitable, trending, and stable companies. Rebalances quarterly.",
    risk: "Medium",
    returnYTD: 8.1,
    return1Y: 15.8,
    color: "#0ea5e9",
  },
  {
    id: "sector-rotation",
    name: "Sector Rotation",
    description:
      "Rotates capital into sectors poised to outperform based on the business cycle. Captures macro-driven momentum across industries.",
    howItWorks:
      "Analyzes economic indicators (PMI, yield curve, credit spreads) to determine the current cycle phase. Overweights early-cycle sectors in recovery, defensive sectors in contraction.",
    risk: "Medium",
    returnYTD: 10.2,
    return1Y: 18.4,
    color: "#84cc16",
  },
  {
    id: "options-wheel",
    name: "Options Wheel",
    description:
      "Sells cash-secured puts to buy stocks at a discount, then sells covered calls for income. Generates returns in flat and rising markets.",
    howItWorks:
      "Step 1: Sell a put on a stock you want to own. If assigned, you buy at a lower cost basis. Step 2: Sell covered calls against the shares for premium income. Repeat.",
    risk: "Medium",
    returnYTD: 7.5,
    return1Y: 14.9,
    color: "#d946ef",
  },
  {
    id: "dividend-growth",
    name: "Dividend Growth",
    description:
      "Invests in companies with a long track record of growing dividends annually. Combines income with capital appreciation over time.",
    howItWorks:
      "Selects companies with 10+ years of consecutive dividend increases, strong payout ratios, and solid earnings growth. Reinvests dividends for compounding.",
    risk: "Low",
    returnYTD: 5.3,
    return1Y: 11.7,
    color: "#059669",
  },
  {
    id: "breakout-trading",
    name: "Breakout Trading",
    description:
      "Enters positions when stocks break through key support or resistance levels on high volume. Captures explosive directional moves.",
    howItWorks:
      "Monitors stocks approaching 52-week highs or consolidation pattern boundaries. Enters on confirmed breakout with above-average volume. Uses tight stop-losses.",
    risk: "High",
    returnYTD: 13.8,
    return1Y: 24.1,
    color: "#dc2626",
  },
  {
    id: "market-neutral",
    name: "Market Neutral",
    description:
      "Maintains equal long and short exposure to eliminate market risk. Aims to profit purely from stock selection regardless of market direction.",
    howItWorks:
      "Pairs every dollar of long exposure with a dollar of short exposure. Returns come from the spread between winning longs and losing shorts, not from market beta.",
    risk: "Low",
    returnYTD: 3.6,
    return1Y: 7.9,
    color: "#64748b",
  },
];
