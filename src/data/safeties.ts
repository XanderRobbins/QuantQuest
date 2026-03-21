export interface Safety {
  id: string;
  name: string;
  description: string;
  risk: "Very Low" | "Low";
  apy: number;
  color: string;
}

export const safeties: Safety[] = [
  {
    id: "treasury",
    name: "Treasury Bonds",
    description:
      "U.S. government-backed securities — the gold standard of safety. Earns steady interest with virtually zero default risk.",
    risk: "Very Low",
    apy: 4.8,
    color: "#0ea5e9",
  },
  {
    id: "hysa",
    name: "High-Yield Savings",
    description:
      "Park your cash and earn competitive interest rates. Fully liquid — withdraw anytime with no penalties.",
    risk: "Very Low",
    apy: 5.1,
    color: "#22d3ee",
  },
  {
    id: "low-vol",
    name: "Low Volatility Fund",
    description:
      "A basket of stocks selected for their low price swings. Participates in market upside with significantly less downside risk.",
    risk: "Low",
    apy: 7.2,
    color: "#34d399",
  },
  {
    id: "cash",
    name: "Cash Reserve",
    description:
      "Uninvested cash sitting in your account. Always available, no risk, but earns minimal returns.",
    risk: "Very Low",
    apy: 0.5,
    color: "#94a3b8",
  },
  {
    id: "money-market",
    name: "Money Market Fund",
    description:
      "Invests in short-term, high-quality debt instruments like commercial paper and T-bills. Near-zero risk with daily liquidity and competitive yields.",
    risk: "Very Low",
    apy: 5.3,
    color: "#38bdf8",
  },
  {
    id: "short-term-bonds",
    name: "Short-Term Bonds",
    description:
      "Bond fund with average maturity under 3 years. Minimal interest rate risk while earning more than savings accounts.",
    risk: "Low",
    apy: 4.5,
    color: "#a78bfa",
  },
  {
    id: "tips",
    name: "TIPS (Inflation-Protected)",
    description:
      "Treasury Inflation-Protected Securities adjust principal with CPI. Preserves purchasing power and guarantees a real return above inflation.",
    risk: "Very Low",
    apy: 3.9,
    color: "#fb923c",
  },
  {
    id: "muni-bonds",
    name: "Municipal Bonds",
    description:
      "Bonds issued by state and local governments. Interest is often tax-exempt, making them attractive for higher tax brackets.",
    risk: "Low",
    apy: 3.7,
    color: "#4ade80",
  },
  {
    id: "stable-value",
    name: "Stable Value Fund",
    description:
      "Combines high-quality bonds with insurance wrappers to guarantee principal and provide steady returns. Popular in retirement accounts.",
    risk: "Very Low",
    apy: 4.2,
    color: "#67e8f9",
  },
  {
    id: "cd-ladder",
    name: "CD Ladder",
    description:
      "A series of certificates of deposit with staggered maturity dates. Locks in higher rates while maintaining periodic liquidity as CDs mature.",
    risk: "Very Low",
    apy: 4.9,
    color: "#fbbf24",
  },
];
