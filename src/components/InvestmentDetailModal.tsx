"use client";

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

export function InvestmentDetailModal({ investmentId, onClose, onInvest }: Props) {
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
