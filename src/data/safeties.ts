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
];
