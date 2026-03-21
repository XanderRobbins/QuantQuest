export const XP_REWARDS = {
  firstInvestment: 100,
  eachInvestment: 25,
  runAnalysis: 50,
  portfolioReaches11k: 200,
  portfolioReaches15k: 500,
  diversify3Holdings: 150,
  firstSell: 50,
} as const;

const LEVELS: { level: number; xp: number; name: string }[] = [
  { level: 1, xp: 0, name: "Paper Trader" },
  { level: 2, xp: 100, name: "Market Rookie" },
  { level: 3, xp: 300, name: "Smart Money" },
  { level: 4, xp: 750, name: "Portfolio Pro" },
  { level: 5, xp: 1500, name: "Quant Master" },
];

export function getLevel(xp: number): {
  level: number;
  name: string;
  xp: number;
  nextLevelXp: number;
  progress: number;
} {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xp) current = l;
  }

  const currentIdx = LEVELS.findIndex((l) => l.level === current.level);
  const next = LEVELS[currentIdx + 1];

  if (!next) {
    return {
      level: current.level,
      name: current.name,
      xp,
      nextLevelXp: current.xp,
      progress: 100,
    };
  }

  const progressRange = next.xp - current.xp;
  const progressCurrent = xp - current.xp;
  const progress = Math.min(
    100,
    Math.round((progressCurrent / progressRange) * 100)
  );

  return {
    level: current.level,
    name: current.name,
    xp,
    nextLevelXp: next.xp,
    progress,
  };
}
