"use client";

import { useState, useEffect } from "react";
import { sectors, type Sector } from "@/data/sectors";
import { strategies, type Strategy } from "@/data/strategies";
import { safeties, type Safety } from "@/data/safeties";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  BarChart3,
  Lightbulb,
  Percent,
  SlidersHorizontal,
  BookOpen,
  Loader2,
} from "lucide-react";

type InvestmentItem =
  | { type: "sector"; data: Sector }
  | { type: "strategy"; data: Strategy }
  | { type: "safety"; data: Safety }
  | null;

function findInvestment(id: string): InvestmentItem {
  const sector = sectors.find((s) => s.id === id);
  if (sector) return { type: "sector", data: sector };
  const strategy = strategies.find((s) => s.id === id);
  if (strategy) return { type: "strategy", data: strategy };
  const safety = safeties.find((s) => s.id === id);
  if (safety) return { type: "safety", data: safety };
  return null;
}

function riskExplanation(risk: string): string {
  switch (risk) {
    case "Very Low":
      return "Minimal chance of losing money. Capital is highly preserved.";
    case "Low":
      return "Small potential for short-term losses. Generally stable.";
    case "Medium":
      return "Moderate price swings. Could see 10-20% drawdowns during stress.";
    case "High":
      return "Significant volatility. 20-40%+ drawdowns possible, but higher long-term potential.";
    default:
      return "";
  }
}

interface Props {
  investmentId: string | null;
  onClose: () => void;
  onInvest: (id: string, name: string, type: "sector" | "strategy" | "safety", risk: string) => void;
}

// ─── Advanced Panel: adjustable weights for sectors ──────────────────────────

function AdvancedPanel({ item }: { item: NonNullable<InvestmentItem> }) {
  const { type, data } = item;

  if (type === "sector") {
    const sector = data as Sector;
    const [weights, setWeights] = useState<Record<string, number>>(() => {
      const w: Record<string, number> = {};
      for (const s of sector.stocks) w[s.symbol] = s.weight;
      return w;
    });

    const total = Object.values(weights).reduce((s, v) => s + v, 0);
    const isBalanced = Math.abs(total - 100) < 0.5;

    function handleChange(symbol: string, value: number) {
      setWeights((prev) => ({ ...prev, [symbol]: value }));
    }

    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">Customize Allocation</h4>
          <span className={`ml-auto text-xs font-mono ${isBalanced ? "text-emerald-600" : "text-red-500"}`}>
            {total.toFixed(0)}% / 100%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Drag the sliders to adjust how much of your investment goes into each stock.
        </p>
        <div className="space-y-3">
          {sector.stocks.map((stock) => (
            <div key={stock.symbol} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm">{stock.symbol}</span>
                  <span className="text-xs text-muted-foreground">{stock.name}</span>
                </div>
                <span className="text-sm font-bold w-10 text-right">{weights[stock.symbol]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={weights[stock.symbol]}
                onChange={(e) => handleChange(stock.symbol, Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-muted"
              />
            </div>
          ))}
        </div>
        {!isBalanced && (
          <p className="text-xs text-red-500">Weights should add up to 100%.</p>
        )}
      </div>
    );
  }

  if (type === "strategy") {
    const strategy = data as Strategy;
    // Show the strategy's typical allocation breakdown
    const allocations = getStrategyAllocations(strategy.id);
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">Strategy Breakdown</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          How this strategy typically allocates your capital:
        </p>
        <div className="space-y-2">
          {allocations.map((a) => (
            <div key={a.label} className="flex items-center justify-between">
              <span className="text-sm">{a.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${a.pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">{a.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Safety
  const safety = data as Safety;
  const safetyDetails = getSafetyDetails(safety.id);
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">Details</h4>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {safetyDetails.map((d) => (
          <div key={d.label} className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{d.label}</p>
            <p className="text-sm font-semibold">{d.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStrategyAllocations(id: string): { label: string; pct: number }[] {
  const map: Record<string, { label: string; pct: number }[]> = {
    "momentum": [
      { label: "Top-performing large caps", pct: 40 },
      { label: "Mid-cap growth stocks", pct: 30 },
      { label: "Sector leaders (rotating)", pct: 20 },
      { label: "Cash buffer", pct: 10 },
    ],
    "mean-reversion": [
      { label: "Oversold large caps", pct: 45 },
      { label: "Value stocks below 50-DMA", pct: 35 },
      { label: "Cash (waiting for signals)", pct: 20 },
    ],
    "risk-parity": [
      { label: "Equities (low weight)", pct: 25 },
      { label: "Bonds", pct: 35 },
      { label: "Commodities", pct: 20 },
      { label: "Real assets", pct: 20 },
    ],
    "dca": [
      { label: "S&P 500 index", pct: 50 },
      { label: "International stocks", pct: 25 },
      { label: "Bonds", pct: 15 },
      { label: "Cash reserves", pct: 10 },
    ],
    "factor-value": [
      { label: "Low P/E stocks", pct: 35 },
      { label: "High dividend yield", pct: 30 },
      { label: "Low price-to-book", pct: 25 },
      { label: "Cash", pct: 10 },
    ],
    "pairs-trading": [
      { label: "Long positions", pct: 45 },
      { label: "Short positions", pct: 45 },
      { label: "Cash margin", pct: 10 },
    ],
    "stat-arb": [
      { label: "Long basket", pct: 40 },
      { label: "Short basket", pct: 40 },
      { label: "Hedging instruments", pct: 10 },
      { label: "Cash collateral", pct: 10 },
    ],
    "trend-following": [
      { label: "Stocks in uptrend", pct: 50 },
      { label: "Commodities trending", pct: 20 },
      { label: "Bonds (when trending)", pct: 15 },
      { label: "Cash (no trend)", pct: 15 },
    ],
    "volatility-harvesting": [
      { label: "Short volatility positions", pct: 40 },
      { label: "Hedged equity", pct: 30 },
      { label: "Tail-risk hedges", pct: 15 },
      { label: "Cash buffer", pct: 15 },
    ],
    "smart-beta": [
      { label: "Low volatility factor", pct: 25 },
      { label: "Quality factor", pct: 25 },
      { label: "Value factor", pct: 25 },
      { label: "Momentum factor", pct: 25 },
    ],
    "sector-rotation": [
      { label: "Current leading sector", pct: 40 },
      { label: "Emerging sector", pct: 25 },
      { label: "Defensive sector", pct: 20 },
      { label: "Cash (between rotations)", pct: 15 },
    ],
    "options-wheel": [
      { label: "Cash-secured puts", pct: 40 },
      { label: "Covered calls", pct: 35 },
      { label: "Stock holdings", pct: 15 },
      { label: "Premium collected", pct: 10 },
    ],
    "dividend-growth": [
      { label: "Dividend aristocrats", pct: 45 },
      { label: "High-growth dividend stocks", pct: 30 },
      { label: "REITs", pct: 15 },
      { label: "Reinvested dividends", pct: 10 },
    ],
    "breakout-trading": [
      { label: "Breakout positions", pct: 50 },
      { label: "Pending breakout setups", pct: 20 },
      { label: "Trailing positions", pct: 15 },
      { label: "Cash (waiting for setups)", pct: 15 },
    ],
    "market-neutral": [
      { label: "Long positions", pct: 45 },
      { label: "Short positions", pct: 45 },
      { label: "Cash buffer", pct: 10 },
    ],
  };
  return map[id] ?? [{ label: "Diversified holdings", pct: 100 }];
}

function getSafetyDetails(id: string): { label: string; value: string }[] {
  const map: Record<string, { label: string; value: string }[]> = {
    "treasury": [
      { label: "Issuer", value: "U.S. Government" },
      { label: "Maturity", value: "10-Year" },
      { label: "Liquidity", value: "Very High" },
      { label: "Tax", value: "Federal taxable, state exempt" },
    ],
    "hysa": [
      { label: "FDIC Insured", value: "Yes, up to $250k" },
      { label: "Minimum Balance", value: "$0" },
      { label: "Withdrawal", value: "Anytime, no penalty" },
      { label: "Interest Paid", value: "Monthly" },
    ],
    "low-vol": [
      { label: "Strategy", value: "Low-beta stock selection" },
      { label: "Holdings", value: "~100 stocks" },
      { label: "Rebalance", value: "Quarterly" },
      { label: "Max Drawdown", value: "~12% (historical)" },
    ],
    "cash": [
      { label: "Type", value: "Sweep account" },
      { label: "Risk", value: "None" },
      { label: "Liquidity", value: "Instant" },
      { label: "Use Case", value: "Dry powder for trades" },
    ],
    "money-market": [
      { label: "Holdings", value: "T-bills, commercial paper" },
      { label: "NAV", value: "Stable $1.00" },
      { label: "Minimum", value: "$0" },
      { label: "Liquidity", value: "Same day" },
    ],
    "short-term-bonds": [
      { label: "Duration", value: "1-3 years" },
      { label: "Credit Quality", value: "Investment grade" },
      { label: "Holdings", value: "~500 bonds" },
      { label: "Sensitivity", value: "Low interest rate risk" },
    ],
    "tips": [
      { label: "Issuer", value: "U.S. Government" },
      { label: "Inflation Adj.", value: "Yes, CPI-linked" },
      { label: "Real Yield", value: "~1.8%" },
      { label: "Best For", value: "Inflation protection" },
    ],
    "muni-bonds": [
      { label: "Tax Status", value: "Federal tax-free" },
      { label: "Credit Quality", value: "AA average" },
      { label: "Duration", value: "5-7 years" },
      { label: "Best For", value: "Tax-conscious investors" },
    ],
    "stable-value": [
      { label: "Structure", value: "Insurance-wrapped bonds" },
      { label: "NAV", value: "Stable, book value" },
      { label: "Liquidity", value: "Daily" },
      { label: "Guarantee", value: "Principal + interest" },
    ],
    "cd-ladder": [
      { label: "Structure", value: "Staggered maturities" },
      { label: "Terms", value: "3, 6, 9, 12 months" },
      { label: "FDIC Insured", value: "Yes, up to $250k" },
      { label: "Penalty", value: "Early withdrawal fee" },
    ],
  };
  return map[id] ?? [{ label: "Type", value: "Safe asset" }];
}

// ─── Explain Panel: AI-powered simple explanation ────────────────────────────

function ExplainPanel({ item }: { item: NonNullable<InvestmentItem> }) {
  const { type, data } = item;
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setExplanation(null);

    fetch("/api/generate-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        type,
        existingDescription: data.description,
        mode: "explain",
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setExplanation(d.description ?? d.error ?? "Could not generate explanation.");
      })
      .catch(() => {
        if (!cancelled) setExplanation(getFallbackExplanation(data.id, data.name));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [data.id, data.name, data.description, type]);

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-amber-600" />
        <h4 className="font-semibold text-sm">Explain Like I&apos;m 5</h4>
        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
          Gemini
        </Badge>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          <span className="text-sm text-muted-foreground">Generating explanation...</span>
        </div>
      ) : (
        <p className="text-sm leading-relaxed">{explanation}</p>
      )}
    </div>
  );
}

function getFallbackExplanation(id: string, name: string): string {
  const fallbacks: Record<string, string> = {
    "tech": "Think of this as buying a tiny piece of the biggest tech companies like Apple and Google. When people buy more iPhones or use more Google searches, your investment grows.",
    "semiconductors": "Semiconductors are the tiny chips inside every phone, car, and computer. They're like the building blocks of all modern technology — investing here means betting that the world keeps needing more tech.",
    "ai-robotics": "This is like investing in the future of smart machines. From ChatGPT to self-driving cars, AI is changing everything — and this basket owns the companies making it happen.",
    "momentum": "Imagine surfing — you ride the wave that's already moving. This strategy buys stocks that are already going up and sells ones going down, betting that trends continue.",
    "treasury": "Lending money to the U.S. government. They pay you interest, and since the government always pays its debts, it's considered the safest investment in the world.",
    "hysa": "Like a regular savings account, but with much better interest. Your money sits there earning about 5% per year, and you can take it out whenever you want.",
  };
  return fallbacks[id] ?? `${name} is an investment option that helps you grow your money. It's designed to balance risk and reward based on market conditions.`;
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function InvestmentDetailModal({ investmentId, onClose, onInvest }: Props) {
  const [activePanel, setActivePanel] = useState<"advanced" | "explain" | null>(null);

  // Reset panel when investment changes
  useEffect(() => {
    setActivePanel(null);
  }, [investmentId]);

  if (!investmentId) return null;
  const item = findInvestment(investmentId);
  if (!item) return null;

  const { type, data } = item;
  const risk = data.risk;
  const riskVariant =
    risk === "High" ? "destructive" : risk === "Medium" ? "warning" : "success";
  const typeBadgeColor =
    type === "sector"
      ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
      : type === "strategy"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

  return (
    <Dialog open={!!investmentId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: data.color }} />
            <DialogTitle className="text-2xl">{data.name}</DialogTitle>
            <Badge className={typeBadgeColor} variant="outline">
              {type === "sector" ? "Sector" : type === "strategy" ? "Strategy" : "Safe Asset"}
            </Badge>
            <Badge variant={riskVariant}>{risk} Risk</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">{data.description}</p>

          {/* Stats grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Risk */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ShieldCheck className="h-4 w-4" /> Risk Level
              </div>
              <p className="font-semibold">{risk}</p>
              <p className="text-xs text-muted-foreground mt-1">{riskExplanation(risk)}</p>
            </div>

            {/* Returns */}
            {type !== "safety" && "return1Y" in data && (
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <BarChart3 className="h-4 w-4" /> Returns
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-1">
                      {(data as Sector | Strategy).return1Y >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className={`text-xl font-bold ${(data as Sector | Strategy).return1Y >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatPercent((data as Sector | Strategy).return1Y)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">1Y Return</span>
                  </div>
                  <div className="border-l border-border pl-3">
                    <div className="flex items-center gap-1">
                      {(data as Sector | Strategy).returnYTD >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className={`text-xl font-bold ${(data as Sector | Strategy).returnYTD >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatPercent((data as Sector | Strategy).returnYTD)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">YTD</span>
                  </div>
                </div>
              </div>
            )}

            {type === "safety" && (
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Percent className="h-4 w-4" /> APY
                </div>
                <span className="text-xl font-bold text-success">
                  {formatPercent((data as Safety).apy)}
                </span>
              </div>
            )}
          </div>

          {/* Sector stocks */}
          {type === "sector" && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <BarChart3 className="h-4 w-4" /> Holdings
              </div>
              <div className="space-y-2">
                {(data as Sector).stocks.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-semibold text-sm">{stock.symbol}</span>
                      <span className="text-muted-foreground text-sm ml-2">{stock.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${stock.weight}%`, backgroundColor: data.color }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{stock.weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategy how it works */}
          {type === "strategy" && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Lightbulb className="h-4 w-4" /> How It Works
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {(data as Strategy).howItWorks}
              </p>
            </div>
          )}

          {/* Advanced / Explain panels */}
          {activePanel === "advanced" && <AdvancedPanel item={item} />}
          {activePanel === "explain" && <ExplainPanel item={item} />}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setActivePanel(activePanel === "advanced" ? null : "advanced")}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {activePanel === "advanced" ? "Hide Advanced" : "Advanced"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setActivePanel(activePanel === "explain" ? null : "explain")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {activePanel === "explain" ? "Hide Explanation" : "Explain"}
            </Button>
          </div>

          {/* Invest button */}
          <Button
            size="lg"
            className="w-full"
            onClick={() => onInvest(data.id, data.name, type, risk)}
          >
            Invest in {data.name}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
