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
];
