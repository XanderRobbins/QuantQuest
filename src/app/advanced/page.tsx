"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchPortfolio, loadPortfolio } from "@/lib/portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Snowflake, Shield, BarChart2,
  Percent, Activity, AlertTriangle, Award, Target, Zap, RefreshCw,
} from "lucide-react";
import type { AdvancedMetrics } from "@/app/api/advanced/route";

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals);
}
function fmtPct(n: number) {
  const val = (n * 100).toFixed(2);
  return `${n >= 0 ? "+" : ""}${val}%`;
}

function getRiskRating(sharpe: number): { label: string; color: string; description: string } {
  if (sharpe >= 2) return { label: "A", color: "text-green-500", description: "Exceptional" };
  if (sharpe >= 1.5) return { label: "B+", color: "text-green-400", description: "Strong" };
  if (sharpe >= 1) return { label: "B", color: "text-blue-400", description: "Good" };
  if (sharpe >= 0.5) return { label: "C", color: "text-yellow-500", description: "Average" };
  if (sharpe >= 0) return { label: "D", color: "text-orange-500", description: "Below Average" };
  return { label: "F", color: "text-red-500", description: "Poor" };
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  description: string;
  highlight?: boolean;
}

function MetricCard({ icon, label, value, sub, positive, description, highlight }: MetricCardProps) {
  const valueColor =
    positive === true ? "text-green-500" :
    positive === false ? "text-red-500" :
    "text-foreground";

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 transition-colors ${
      highlight
        ? "border-primary/40 bg-primary/5"
        : "border-border/60 bg-card"
    }`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-primary/70">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-black tabular-nums ${valueColor}`}>{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{description}</p>
    </div>
  );
}

export default function AdvancedPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const p = await apiFetchPortfolio() ?? loadPortfolio();
      if (!p) { router.push("/"); return; }

      const res = await fetch("/api/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: p.history, totalDeposited: p.totalDeposited }),
      });
      if (!res.ok) throw new Error("Failed to compute metrics");
      const data: AdvancedMetrics = await res.json();
      setMetrics(data);
    } catch {
      setError("Could not compute metrics. Make sure you have portfolio history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const rating = metrics ? getRiskRating(metrics.sharpeRatio) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary/80">Advanced Analytics</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Portfolio Metrics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Professional-grade risk &amp; return statistics
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {metrics && (
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border ${
              metrics.computedBy === "snowflake"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-border/40 border-border text-muted-foreground"
            }`}>
              <Snowflake className="h-3.5 w-3.5" />
              {metrics.computedBy === "snowflake" ? "Powered by Snowflake" : "Computed Locally"}
            </div>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Metrics */}
      {!loading && metrics && (
        <>
          {/* Risk Score Banner */}
          <div className="rounded-xl border border-border/60 bg-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Risk-Adjusted Rating</p>
              <div className="flex items-baseline gap-3">
                <span className={`text-5xl font-black ${rating?.color}`}>{rating?.label}</span>
                <div>
                  <p className={`text-lg font-bold ${rating?.color}`}>{rating?.description}</p>
                  <p className="text-xs text-muted-foreground">Based on Sharpe Ratio of {fmt(metrics.sharpeRatio)}</p>
                </div>
              </div>
            </div>
            <div className="hidden sm:grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trading Days</p>
                <p className="text-xl font-black">{metrics.tradingDays}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                <p className={`text-xl font-black ${metrics.winRate >= 0.5 ? "text-green-500" : "text-red-500"}`}>
                  {(metrics.winRate * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Return</p>
                <p className={`text-xl font-black ${metrics.totalReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {fmtPct(metrics.totalReturn)}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Return Metrics */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" /> Return Metrics
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Total Return"
                value={fmtPct(metrics.totalReturn)}
                positive={metrics.totalReturn >= 0}
                description="Cumulative return since your first deposit"
              />
              <MetricCard
                icon={<Zap className="h-4 w-4" />}
                label="Annualized Return"
                value={fmtPct(metrics.annualizedReturn)}
                sub="/ year"
                positive={metrics.annualizedReturn >= 0}
                description="Projected annual return based on your history (252 trading days)"
              />
              <MetricCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Best Day"
                value={fmtPct(metrics.bestDay)}
                positive={true}
                description="Your single best daily return"
              />
              <MetricCard
                icon={<TrendingDown className="h-4 w-4" />}
                label="Worst Day"
                value={fmtPct(metrics.worstDay)}
                positive={false}
                description="Your single worst daily return"
              />
            </div>
          </div>

          {/* Section: Risk Metrics */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" /> Risk Metrics
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                icon={<Activity className="h-4 w-4" />}
                label="Volatility"
                value={fmtPct(metrics.volatility)}
                sub="annualized"
                positive={null}
                description="Standard deviation of daily returns, scaled to annual. Lower = more stable."
              />
              <MetricCard
                icon={<TrendingDown className="h-4 w-4" />}
                label="Max Drawdown"
                value={fmtPct(metrics.maxDrawdown)}
                positive={false}
                description="Largest peak-to-trough decline. Measures worst-case loss from any peak."
              />
              <MetricCard
                icon={<Percent className="h-4 w-4" />}
                label="Win Rate"
                value={`${(metrics.winRate * 100).toFixed(1)}%`}
                positive={metrics.winRate >= 0.5}
                description="Percentage of trading days with a positive return."
              />
              <MetricCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="VaR (95%)"
                value={fmtPct(metrics.var95)}
                sub="daily"
                positive={false}
                description="Value at Risk: on 95% of days your loss should not exceed this amount."
              />
            </div>
          </div>

          {/* Section: Risk-Adjusted Ratios */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <BarChart2 className="h-3.5 w-3.5" /> Risk-Adjusted Ratios
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <MetricCard
                icon={<Award className="h-4 w-4" />}
                label="Sharpe Ratio"
                value={fmt(metrics.sharpeRatio)}
                positive={metrics.sharpeRatio >= 1}
                description="(Return − Risk-Free Rate) / Volatility. Above 1 is good, above 2 is excellent. Uses 5% annual risk-free rate."
                highlight
              />
              <MetricCard
                icon={<Target className="h-4 w-4" />}
                label="Sortino Ratio"
                value={fmt(metrics.sortinoRatio)}
                positive={metrics.sortinoRatio >= 1}
                description="Like Sharpe, but only penalizes downside volatility. Better measure for asymmetric returns."
                highlight
              />
              <MetricCard
                icon={<BarChart2 className="h-4 w-4" />}
                label="Calmar Ratio"
                value={fmt(metrics.calmarRatio)}
                positive={metrics.calmarRatio >= 0.5}
                description="Annualized return divided by max drawdown. Higher = better return per unit of drawdown risk."
                highlight
              />
            </div>
          </div>

          {/* Ratio Guide */}
          <div className="rounded-xl border border-border/40 bg-card/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Sharpe Ratio Benchmarks</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { range: "< 0", label: "Unacceptable", color: "text-red-500" },
                { range: "0 – 0.5", label: "Below Avg", color: "text-orange-500" },
                { range: "0.5 – 1", label: "Average", color: "text-yellow-500" },
                { range: "1 – 2", label: "Good", color: "text-blue-400" },
                { range: "> 2", label: "Excellent", color: "text-green-500" },
              ].map((b) => (
                <div key={b.range} className="text-center">
                  <p className={`text-sm font-bold ${b.color}`}>{b.range}</p>
                  <p className="text-xs text-muted-foreground">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
