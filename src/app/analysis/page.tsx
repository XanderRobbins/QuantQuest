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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertTriangle, Sparkles, Scale, Loader2, TrendingUp } from "lucide-react";
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
    subtitle: string;
    icon: typeof AlertTriangle;
    gradient: string;
    border: string;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      key: "critic",
      title: "The Critic",
      subtitle: "Risk & Downside",
      icon: AlertTriangle,
      gradient: "from-red-500/8 to-transparent",
      border: "border-red-500/25",
      iconBg: "bg-red-500/15",
      iconColor: "text-red-400",
    },
    {
      key: "optimist",
      title: "The Optimist",
      subtitle: "Upside Potential",
      icon: Sparkles,
      gradient: "from-emerald-500/8 to-transparent",
      border: "border-emerald-500/25",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
    },
    {
      key: "realist",
      title: "The Realist",
      subtitle: "Balanced Outlook",
      icon: Scale,
      gradient: "from-blue-500/8 to-transparent",
      border: "border-blue-500/25",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
    },
  ];

  return (
    <div className="space-y-6">
      {newAchievements.length > 0 && (
        <AchievementToast
          achievementIds={newAchievements}
          onDismiss={() => setNewAchievements([])}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary/80">AI Analysis</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Portfolio Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">Three AI perspectives powered by Google Gemini</p>
        </div>
        <Button size="lg" onClick={runAnalysis} disabled={loading} className="gap-2 flex-shrink-0 shadow-lg shadow-primary/20">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>

      {/* Portfolio snapshot */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Value", value: formatCurrency(totalValue), color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          { label: "Sectors", value: formatCurrency(allocation.sector), color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
          { label: "Strategies", value: formatCurrency(allocation.strategy), color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
          { label: "Safe Assets", value: formatCurrency(allocation.safety), color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl border ${m.border} ${m.bg} p-4`}>
            <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
            <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {holdingNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {holdingNames.map((name) => (
            <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-5 lg:grid-cols-3">
          {perspectives.map((p) => (
            <div key={p.key} className={`rounded-xl border ${p.border} bg-gradient-to-b ${p.gradient} p-5 space-y-3`}>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="grid gap-5 lg:grid-cols-3">
          {perspectives.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                className={`rounded-xl border ${p.border} bg-gradient-to-b ${p.gradient} overflow-hidden`}
              >
                <div className="p-5 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${p.iconBg}`}>
                      <Icon className={`h-5 w-5 ${p.iconColor}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-base ${p.iconColor}`}>{p.title}</h3>
                      <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">{analysis[p.key]}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!analysis && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Brain className="h-8 w-8 text-primary/60" />
          </div>
          <h3 className="text-xl font-bold">Ready for AI Analysis</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Get three AI perspectives on your portfolio — a Critic, an Optimist, and a Realist — powered by Google Gemini.
          </p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground/60">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{holdingNames.length} positions · {formatCurrency(totalValue)} total value</span>
          </div>
          <Button onClick={runAnalysis} className="mt-6 gap-2 shadow-lg shadow-primary/20">
            <Brain className="h-4 w-4" />
            Run Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
