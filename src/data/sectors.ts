export interface SectorStock {
  symbol: string;
  name: string;
  weight: number;
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  risk: "Low" | "Medium" | "High";
  returnYTD: number;
  return1Y: number;
  stocks: SectorStock[];
  color: string;
}

export const sectors: Sector[] = [
  {
    id: "tech",
    name: "Technology",
    description:
      "Exposure to leading technology companies driving innovation in software, cloud computing, AI, and consumer electronics.",
    risk: "Medium",
    returnYTD: 12.4,
    return1Y: 28.7,
    stocks: [
      { symbol: "AAPL", name: "Apple", weight: 20 },
      { symbol: "MSFT", name: "Microsoft", weight: 20 },
      { symbol: "GOOGL", name: "Alphabet", weight: 15 },
      { symbol: "NVDA", name: "NVIDIA", weight: 15 },
      { symbol: "META", name: "Meta Platforms", weight: 15 },
      { symbol: "AMZN", name: "Amazon", weight: 15 },
    ],
    color: "#6366f1",
  },
  {
    id: "finance",
    name: "Finance",
    description:
      "A diversified basket of major financial institutions including banks, asset managers, and fintech companies.",
    risk: "Medium",
    returnYTD: 8.2,
    return1Y: 15.3,
    stocks: [
      { symbol: "JPM", name: "JPMorgan Chase", weight: 25 },
      { symbol: "BAC", name: "Bank of America", weight: 20 },
      { symbol: "GS", name: "Goldman Sachs", weight: 20 },
      { symbol: "V", name: "Visa", weight: 20 },
      { symbol: "MA", name: "Mastercard", weight: 15 },
    ],
    color: "#10b981",
  },
  {
    id: "energy",
    name: "Energy",
    description:
      "Invest in the energy sector spanning oil & gas majors and renewable energy leaders positioned for the energy transition.",
    risk: "High",
    returnYTD: -3.1,
    return1Y: 6.8,
    stocks: [
      { symbol: "XOM", name: "ExxonMobil", weight: 25 },
      { symbol: "CVX", name: "Chevron", weight: 25 },
      { symbol: "NEE", name: "NextEra Energy", weight: 20 },
      { symbol: "ENPH", name: "Enphase Energy", weight: 15 },
      { symbol: "SLB", name: "Schlumberger", weight: 15 },
    ],
    color: "#f59e0b",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description:
      "Broad healthcare exposure including pharmaceuticals, biotech, medical devices, and healthcare services companies.",
    risk: "Medium",
    returnYTD: 5.6,
    return1Y: 11.2,
    stocks: [
      { symbol: "UNH", name: "UnitedHealth", weight: 25 },
      { symbol: "JNJ", name: "Johnson & Johnson", weight: 20 },
      { symbol: "LLY", name: "Eli Lilly", weight: 20 },
      { symbol: "PFE", name: "Pfizer", weight: 15 },
      { symbol: "ABBV", name: "AbbVie", weight: 20 },
    ],
    color: "#ef4444",
  },
  {
    id: "faang",
    name: "FAANG+",
    description:
      "The iconic FAANG stocks — Meta, Apple, Amazon, Netflix, and Google — plus NVIDIA and Microsoft. The mega-cap growth basket.",
    risk: "Medium",
    returnYTD: 14.8,
    return1Y: 32.1,
    stocks: [
      { symbol: "META", name: "Meta Platforms", weight: 14 },
      { symbol: "AAPL", name: "Apple", weight: 14 },
      { symbol: "AMZN", name: "Amazon", weight: 14 },
      { symbol: "NFLX", name: "Netflix", weight: 14 },
      { symbol: "GOOGL", name: "Alphabet", weight: 14 },
      { symbol: "NVDA", name: "NVIDIA", weight: 15 },
      { symbol: "MSFT", name: "Microsoft", weight: 15 },
    ],
    color: "#8b5cf6",
  },
  {
    id: "semiconductors",
    name: "Semiconductors",
    description:
      "Pure-play semiconductor exposure covering chip designers, manufacturers, and equipment makers powering the AI revolution.",
    risk: "High",
    returnYTD: 18.3,
    return1Y: 45.2,
    stocks: [
      { symbol: "NVDA", name: "NVIDIA", weight: 25 },
      { symbol: "AMD", name: "AMD", weight: 20 },
      { symbol: "AVGO", name: "Broadcom", weight: 20 },
      { symbol: "TSM", name: "TSMC", weight: 20 },
      { symbol: "INTC", name: "Intel", weight: 15 },
    ],
    color: "#06b6d4",
  },
];
