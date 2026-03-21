export interface Holding {
  id: string;
  type: "sector" | "strategy" | "safety";
  amount: number;
}

export interface PortfolioState {
  userId: string;
  username: string;
  holdings: Holding[];
  history: { date: string; value: number }[];
}

const STORAGE_KEY = "quantquest_portfolio";
const USERID_KEY = "quantquest_userId";

function generateUserId(): string {
  return "user_" + Math.random().toString(36).substring(2, 15);
}

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let userId = localStorage.getItem(USERID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USERID_KEY, userId);
  }
  return userId;
}

export function setUserId(userId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USERID_KEY, userId);
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USERID_KEY);
  }
}

export function getDefaultPortfolio(username: string): PortfolioState {
  const today = new Date();
  const history: { date: string; value: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    history.push({
      date: date.toISOString().split("T")[0],
      value: 0,
    });
  }

  return {
    userId: getUserId(),
    username,
    holdings: [{ id: "cash", type: "safety", amount: 0 }],
    history,
  };
}

// --- Local storage (fallback) ---

export function savePortfolio(portfolio: PortfolioState): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }
}

export function loadPortfolio(): PortfolioState | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  return JSON.parse(data) as PortfolioState;
}

// --- API calls (MongoDB) ---

export async function apiCreatePortfolio(username: string): Promise<PortfolioState> {
  const userId = getUserId();
  const res = await fetch("/api/portfolio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, username }),
  });
  if (!res.ok) {
    // Fallback to local
    const p = getDefaultPortfolio(username);
    savePortfolio(p);
    return p;
  }
  const data = await res.json();
  const portfolio = normalizePortfolio(data);
  savePortfolio(portfolio);
  return portfolio;
}

export async function apiFetchPortfolio(): Promise<PortfolioState | null> {
  const userId = getUserId();
  if (!userId) return loadPortfolio();
  try {
    const res = await fetch(`/api/portfolio?userId=${userId}`);
    if (!res.ok) return loadPortfolio();
    const data = await res.json();
    const portfolio = normalizePortfolio(data);
    savePortfolio(portfolio);
    return portfolio;
  } catch {
    return loadPortfolio();
  }
}

export interface InvestResult {
  portfolio: PortfolioState;
  solana: { signature: string; explorerUrl: string } | null;
}

export async function apiInvest(
  targetId: string,
  targetType: "sector" | "strategy" | "safety",
  amount: number
): Promise<InvestResult | null> {
  const userId = getUserId();
  try {
    const res = await fetch("/api/invest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetId, targetType, amount }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const portfolio = normalizePortfolio(data);
    savePortfolio(portfolio);
    return {
      portfolio,
      solana: (data.solana as { signature: string; explorerUrl: string } | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function apiSell(
  targetId: string,
  amount: number
): Promise<InvestResult | null> {
  const userId = getUserId();
  try {
    const res = await fetch("/api/invest", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetId, amount }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const portfolio = normalizePortfolio(data);
    savePortfolio(portfolio);
    return {
      portfolio,
      solana: (data.solana as { signature: string; explorerUrl: string } | null) ?? null,
    };
  } catch {
    return null;
  }
}

function normalizePortfolio(data: Record<string, unknown>): PortfolioState {
  return {
    userId: (data.userId as string) ?? "",
    username: (data.username as string) ?? "",
    holdings: (data.holdings as Holding[]) ?? [],
    history: (data.history as { date: string; value: number }[]) ?? [],
  };
}

// --- Utility ---

export function getTotalValue(portfolio: PortfolioState): number {
  return portfolio.holdings.reduce((sum, h) => sum + h.amount, 0);
}

export function getAllocationByType(portfolio: PortfolioState) {
  const groups = { sector: 0, strategy: 0, safety: 0 };
  for (const h of portfolio.holdings) {
    groups[h.type] += h.amount;
  }
  return groups;
}
