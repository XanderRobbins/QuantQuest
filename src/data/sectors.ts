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
  {
    id: "real-estate",
    name: "Real Estate",
    description:
      "Diversified REIT exposure spanning commercial, residential, and industrial real estate. Offers steady income through dividends and inflation protection.",
    risk: "Medium",
    returnYTD: 3.8,
    return1Y: 9.4,
    stocks: [
      { symbol: "VNQ", name: "Vanguard Real Estate ETF", weight: 30 },
      { symbol: "PLD", name: "Prologis", weight: 20 },
      { symbol: "AMT", name: "American Tower", weight: 20 },
      { symbol: "SPG", name: "Simon Property Group", weight: 15 },
      { symbol: "O", name: "Realty Income", weight: 15 },
    ],
    color: "#d97706",
  },
  {
    id: "consumer-staples",
    name: "Consumer Staples",
    description:
      "Defensive companies producing everyday essentials — food, beverages, and household products. Reliable performers in any market environment.",
    risk: "Low",
    returnYTD: 4.1,
    return1Y: 8.7,
    stocks: [
      { symbol: "PG", name: "Procter & Gamble", weight: 25 },
      { symbol: "KO", name: "Coca-Cola", weight: 20 },
      { symbol: "PEP", name: "PepsiCo", weight: 20 },
      { symbol: "WMT", name: "Walmart", weight: 20 },
      { symbol: "COST", name: "Costco", weight: 15 },
    ],
    color: "#059669",
  },
  {
    id: "consumer-discretionary",
    name: "Consumer Discretionary",
    description:
      "Companies selling non-essential goods and services — autos, apparel, restaurants, and retail. Thrives when consumer confidence is high.",
    risk: "High",
    returnYTD: 7.9,
    return1Y: 19.3,
    stocks: [
      { symbol: "TSLA", name: "Tesla", weight: 25 },
      { symbol: "NKE", name: "Nike", weight: 20 },
      { symbol: "SBUX", name: "Starbucks", weight: 20 },
      { symbol: "HD", name: "Home Depot", weight: 20 },
      { symbol: "MCD", name: "McDonald's", weight: 15 },
    ],
    color: "#e11d48",
  },
  {
    id: "industrials",
    name: "Industrials",
    description:
      "Heavy industry leaders in machinery, aerospace, transportation, and conglomerates. Benefits from infrastructure spending and economic expansion.",
    risk: "Medium",
    returnYTD: 6.3,
    return1Y: 13.5,
    stocks: [
      { symbol: "CAT", name: "Caterpillar", weight: 20 },
      { symbol: "HON", name: "Honeywell", weight: 20 },
      { symbol: "UNP", name: "Union Pacific", weight: 20 },
      { symbol: "GE", name: "GE Aerospace", weight: 20 },
      { symbol: "BA", name: "Boeing", weight: 20 },
    ],
    color: "#78716c",
  },
  {
    id: "utilities",
    name: "Utilities",
    description:
      "Regulated electric, gas, and water utilities offering stable dividends and low volatility. A classic defensive sector during downturns.",
    risk: "Low",
    returnYTD: 2.9,
    return1Y: 7.1,
    stocks: [
      { symbol: "NEE", name: "NextEra Energy", weight: 25 },
      { symbol: "DUK", name: "Duke Energy", weight: 20 },
      { symbol: "SO", name: "Southern Company", weight: 20 },
      { symbol: "AEP", name: "American Electric Power", weight: 20 },
      { symbol: "D", name: "Dominion Energy", weight: 15 },
    ],
    color: "#4ade80",
  },
  {
    id: "materials",
    name: "Materials",
    description:
      "Companies producing chemicals, metals, construction materials, and packaging. Cyclical sector that benefits from global industrial demand.",
    risk: "Medium",
    returnYTD: 5.1,
    return1Y: 10.8,
    stocks: [
      { symbol: "LIN", name: "Linde", weight: 25 },
      { symbol: "APD", name: "Air Products", weight: 20 },
      { symbol: "ECL", name: "Ecolab", weight: 20 },
      { symbol: "SHW", name: "Sherwin-Williams", weight: 20 },
      { symbol: "NEM", name: "Newmont", weight: 15 },
    ],
    color: "#a3a3a3",
  },
  {
    id: "communication-services",
    name: "Communication Services",
    description:
      "Media, entertainment, telecom, and social platforms. Combines high-growth digital advertising with stable telecom revenues.",
    risk: "Medium",
    returnYTD: 11.2,
    return1Y: 24.6,
    stocks: [
      { symbol: "GOOGL", name: "Alphabet", weight: 25 },
      { symbol: "META", name: "Meta Platforms", weight: 25 },
      { symbol: "DIS", name: "Walt Disney", weight: 20 },
      { symbol: "NFLX", name: "Netflix", weight: 20 },
      { symbol: "T", name: "AT&T", weight: 10 },
    ],
    color: "#f472b6",
  },
  {
    id: "aerospace-defense",
    name: "Aerospace & Defense",
    description:
      "Defense contractors and aerospace manufacturers benefiting from sustained government spending and geopolitical demand for military hardware.",
    risk: "Medium",
    returnYTD: 9.7,
    return1Y: 21.4,
    stocks: [
      { symbol: "LMT", name: "Lockheed Martin", weight: 25 },
      { symbol: "RTX", name: "RTX (Raytheon)", weight: 20 },
      { symbol: "NOC", name: "Northrop Grumman", weight: 20 },
      { symbol: "GD", name: "General Dynamics", weight: 20 },
      { symbol: "BA", name: "Boeing", weight: 15 },
    ],
    color: "#1e3a5f",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    description:
      "High-growth companies protecting enterprises from cyber threats. Recurring revenue models with massive tailwinds from digital transformation.",
    risk: "High",
    returnYTD: 16.5,
    return1Y: 38.9,
    stocks: [
      { symbol: "CRWD", name: "CrowdStrike", weight: 25 },
      { symbol: "PANW", name: "Palo Alto Networks", weight: 25 },
      { symbol: "FTNT", name: "Fortinet", weight: 20 },
      { symbol: "ZS", name: "Zscaler", weight: 15 },
      { symbol: "S", name: "SentinelOne", weight: 15 },
    ],
    color: "#7c3aed",
  },
  {
    id: "biotech",
    name: "Biotech",
    description:
      "Biotechnology companies developing breakthrough therapies and treatments. High reward potential balanced by clinical trial and regulatory risk.",
    risk: "High",
    returnYTD: 8.4,
    return1Y: 17.6,
    stocks: [
      { symbol: "AMGN", name: "Amgen", weight: 25 },
      { symbol: "GILD", name: "Gilead Sciences", weight: 20 },
      { symbol: "REGN", name: "Regeneron", weight: 20 },
      { symbol: "VRTX", name: "Vertex Pharma", weight: 20 },
      { symbol: "MRNA", name: "Moderna", weight: 15 },
    ],
    color: "#dc2626",
  },
  {
    id: "clean-energy",
    name: "Clean Energy",
    description:
      "Solar, wind, and renewable energy companies leading the global energy transition. Volatile but positioned for long-term secular growth.",
    risk: "High",
    returnYTD: -5.2,
    return1Y: 4.3,
    stocks: [
      { symbol: "ENPH", name: "Enphase Energy", weight: 25 },
      { symbol: "SEDG", name: "SolarEdge", weight: 20 },
      { symbol: "FSLR", name: "First Solar", weight: 20 },
      { symbol: "RUN", name: "Sunrun", weight: 20 },
      { symbol: "PLUG", name: "Plug Power", weight: 15 },
    ],
    color: "#16a34a",
  },
  {
    id: "ai-robotics",
    name: "AI & Robotics",
    description:
      "Companies at the forefront of artificial intelligence, machine learning, and robotics. A bet on the most transformative technology trend of the decade.",
    risk: "High",
    returnYTD: 21.7,
    return1Y: 52.3,
    stocks: [
      { symbol: "NVDA", name: "NVIDIA", weight: 25 },
      { symbol: "PLTR", name: "Palantir", weight: 20 },
      { symbol: "PATH", name: "UiPath", weight: 15 },
      { symbol: "ISRG", name: "Intuitive Surgical", weight: 20 },
      { symbol: "ABNB", name: "Airbnb", weight: 20 },
    ],
    color: "#2563eb",
  },
  {
    id: "fintech",
    name: "Fintech",
    description:
      "Disruptive financial technology companies reshaping payments, lending, and crypto. High growth with exposure to digital finance innovation.",
    risk: "High",
    returnYTD: 10.3,
    return1Y: 26.8,
    stocks: [
      { symbol: "SQ", name: "Block (Square)", weight: 25 },
      { symbol: "PYPL", name: "PayPal", weight: 20 },
      { symbol: "COIN", name: "Coinbase", weight: 20 },
      { symbol: "SOFI", name: "SoFi Technologies", weight: 20 },
      { symbol: "AFRM", name: "Affirm", weight: 15 },
    ],
    color: "#0891b2",
  },
  {
    id: "gaming-esports",
    name: "Gaming & Esports",
    description:
      "Video game publishers, platforms, and esports companies. Benefiting from growing digital entertainment spend and metaverse development.",
    risk: "High",
    returnYTD: 6.8,
    return1Y: 14.9,
    stocks: [
      { symbol: "RBLX", name: "Roblox", weight: 20 },
      { symbol: "EA", name: "Electronic Arts", weight: 20 },
      { symbol: "TTWO", name: "Take-Two Interactive", weight: 20 },
      { symbol: "ATVI", name: "Activision Blizzard", weight: 20 },
      { symbol: "U", name: "Unity Software", weight: 20 },
    ],
    color: "#c026d3",
  },
];
