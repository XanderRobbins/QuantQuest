"use client";

import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface Props {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalDeposited?: number;
}

export function PortfolioMetrics({
  totalValue,
  dailyChange,
  dailyChangePercent,
  totalReturn,
  totalReturnPercent,
  totalDeposited = 0,
}: Props) {
  const isUp = (v: number) => v >= 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Portfolio Value */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Portfolio Value</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground">{formatCurrency(totalValue)}</p>
        <p className="text-xs text-muted-foreground">
          Total Invested Capital: <span className="font-semibold text-foreground">{formatCurrency(totalDeposited)}</span>
        </p>
      </div>

      {/* Daily Change */}
      <div className={`rounded-xl border bg-card p-4 space-y-1 ${
        isUp(dailyChange) ? "border-success/20" : "border-destructive/20"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            isUp(dailyChange) ? "bg-success/10" : "bg-destructive/10"
          }`}>
            {isUp(dailyChange)
              ? <TrendingUp className="h-3.5 w-3.5 text-success" />
              : <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            }
          </div>
        </div>
        <p className={`text-2xl font-black ${isUp(dailyChange) ? "text-success" : "text-destructive"}`}>
          {isUp(dailyChange) ? "+" : "-"}{formatCurrency(Math.abs(dailyChange))}
        </p>
        <p className={`text-xs font-semibold ${isUp(dailyChange) ? "text-success/80" : "text-destructive/80"}`}>
          {formatPercent(dailyChangePercent)} today
        </p>
      </div>

      {/* Total Return */}
      <div className={`rounded-xl border bg-card p-4 space-y-1 ${
        isUp(totalReturn) ? "border-success/20" : "border-destructive/20"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">All Time</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            isUp(totalReturn) ? "bg-success/10" : "bg-destructive/10"
          }`}>
            {isUp(totalReturn)
              ? <TrendingUp className="h-3.5 w-3.5 text-success" />
              : <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            }
          </div>
        </div>
        <p className={`text-2xl font-black ${isUp(totalReturn) ? "text-success" : "text-destructive"}`}>
          {isUp(totalReturn) ? "+" : "-"}{formatCurrency(Math.abs(totalReturn))}
        </p>
        <p className={`text-xs font-semibold ${isUp(totalReturn) ? "text-success/80" : "text-destructive/80"}`}>
          {formatPercent(totalReturnPercent)} total
        </p>
      </div>
    </div>
  );
}
