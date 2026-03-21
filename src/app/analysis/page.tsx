"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiFetchPortfolio,
  loadPortfolio,
  getTotalValue,
  getAllocationByType,
  type PortfolioState,
} from "@/lib/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertTriangle, Sparkles, Scale, Loader2 } from "lucide-react";
import { AchievementToast } from "@/components/AchievementToast";
import { getUserId } from "@/lib/portfolio";
import { sectors } from "@/data/sectors";
import { strategies } from "@/data/strategies";
import { safeties } from "@/data/safeties";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface Analysis {
  critic: string;
  optimist: string;
  realist: string;
}

type Perspective = "critic" | "optimist" | "realist";

export default function AnalysisPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const p = (await apiFetchPortfolio()) ?? loadPortfolio();
      if (!p) {
        router.push("/");
        return;
      }
      setPortfolio(p);
    }
    load();
  }, [router]);

  if (!portfolio) return null;

  const totalValue = getTotalValue(portfolio);
  const allocation = getAllocationByType(portfolio);

  const holdingNames = portfolio.holdings
    .filter((h) => h.id !== "cash" && h.amount > 0)
    .map((h) => {
      const item =
        sectors.find((s) => s.id === h.id) ||
        strategies.find((s) => s.id === h.id) ||
        safeties.find((s) => s.id === h.id);
      return `${item?.name ?? h.id} (${formatCurrency(h.amount)})`;
    });

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalValue, allocation, holdings: holdingNames }),
      });
      const data = await res.json();
      if (res.ok && data.critic && data.optimist && data.realist) {
        setAnalysis(data);
      } else {
        setAnalysis({
          critic: `Your ${formatCurrency(totalValue)} portfolio has ${holdingNames.length} positions. ${allocation.sector > allocation.safety ? "Heavy sector exposure with limited defensive allocation creates downside risk in market corrections." : "Your conservative tilt may underperform in bull markets."} Consider rebalancing to reduce concentration risk and improve your risk-adjusted returns.`,
          optimist: `With ${formatCurrency(totalValue)} deployed across ${holdingNames.length} positions, you're capturing real market opportunities. ${allocation.strategy > 0 ? "Your quantitative strategies provide systematic alpha that most retail investors never access." : "Adding quantitative strategies could significantly boost your risk-adjusted returns."} The diversification here positions you well for multiple market scenarios.`,
          realist: `Your portfolio is ${allocation.safety > totalValue * 0.5 ? "conservatively" : allocation.sector > totalValue * 0.5 ? "aggressively" : "moderately"} positioned with an estimated annual return of ${formatPercent(((allocation.sector * 0.12 + allocation.strategy * 0.10 + allocation.safety * 0.05) / Math.max(totalValue, 1)) * 100)}. Expect normal volatility of 10-15% annually. Key risk remains ${allocation.sector > allocation.strategy ? "sector concentration" : "strategy model risk"}.`,
        });
      }
      // Gamification — non-blocking
      try {
        const gamRes = await fetch("/api/gamification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: getUserId(), action: "analyze" }),
        });
        if (gamRes.ok) {
          const gamData = await gamRes.json();
          if (gamData.newAchievements?.length > 0) {
            setNewAchievements(gamData.newAchievements);
          }
        }
      } catch { /* gamification non-fatal */ }
    } finally {
      setLoading(false);
    }
  };

  const perspectives: {
    key: Perspective;
    title: string;
    icon: typeof AlertTriangle;
    color: string;
    border: string;
    bg: string;
  }[] = [
    { key: "critic", title: "The Critic", icon: AlertTriangle, color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/5" },
    { key: "optimist", title: "The Optimist", icon: Sparkles, color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
    { key: "realist", title: "The Realist", icon: Scale, color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5" },
  ];

  return (
    <div className="space-y-6">
      {/* Achievement toast */}
      {newAchievements.length > 0 && (
        <AchievementToast
          achievementIds={newAchievements}
          onDismiss={() => setNewAchievements([])}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Analysis</h1>
          <p className="text-muted-foreground">Three AI perspectives on your investments</p>
        </div>
        <Button size="lg" onClick={runAnalysis} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Value", value: formatCurrency(totalValue), color: "text-primary" },
          { label: "Sectors", value: formatCurrency(allocation.sector), color: "text-[#6366f1]" },
          { label: "Strategies", value: formatCurrency(allocation.strategy), color: "text-[#f97316]" },
          { label: "Safeties", value: formatCurrency(allocation.safety), color: "text-[#22c55e]" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-xl font-bold mt-1 ${m.color}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {holdingNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {holdingNames.map((name) => (
            <Badge key={name} variant="secondary">{name}</Badge>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-6 lg:grid-cols-3">
          {perspectives.map((p) => (
            <Card key={p.key} className={`${p.border} ${p.bg}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="grid gap-6 lg:grid-cols-3">
          {perspectives.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.key} className={`${p.border} ${p.bg}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${p.color}`} />
                    <CardTitle className={`text-lg ${p.color}`}>{p.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{analysis[p.key]}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!analysis && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-16 text-center">
          <Brain className="h-14 w-14 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold">Ready for AI Analysis</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Click &quot;Run Analysis&quot; to get three AI perspectives — a Critic, an Optimist, and a Realist — powered by Google Gemini.
          </p>
          <Button onClick={runAnalysis} className="mt-6 gap-2">
            <Brain className="h-4 w-4" />
            Run Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
