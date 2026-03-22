"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchPortfolio, loadPortfolio, getTotalValue, getAllocationByType, apiSell, type PortfolioState } from "@/lib/portfolio";
import { PortfolioMetrics } from "@/components/PortfolioMetrics";
import { EquityCurve } from "@/components/EquityCurve";
import { AllocationPieChart } from "@/components/AllocationPieChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, TrendingUp, Trophy, Activity, ShieldCheck, ExternalLink } from "lucide-react";
import { AchievementToast } from "@/components/AchievementToast";
import { getUserId } from "@/lib/portfolio";
import Link from "next/link";
import { LeaderboardSidebar } from "@/components/LeaderboardSidebar";
import { sectors } from "@/data/sectors";
import { strategies } from "@/data/strategies";
import { safeties } from "@/data/safeties";
import { formatCurrency } from "@/lib/utils";
import { TransactionHistory, useSolanaStats } from "@/components/TransactionHistory";
import { NessieBalance } from "@/components/NessieBalance";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const solanaStats = useSolanaStats();

  useEffect(() => {
    async function load() {
      const p = await apiFetchPortfolio() ?? loadPortfolio();
      if (!p) {
        router.push("/");
        return;
      }
      setPortfolio(p);
    }
    load();

    // Silently refresh portfolio every 60 seconds
    const interval = setInterval(async () => {
      const p = await apiFetchPortfolio();
      if (p) setPortfolio(p);
    }, 60000);

    return () => clearInterval(interval);
  }, [router]);

  const handleSell = async (holdingId: string, amount: number) => {
    setSellingId(holdingId);
    const result = await apiSell(holdingId, amount);
    if (result) {
      setPortfolio(result.portfolio);
      try {
        const gamRes = await fetch("/api/gamification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: getUserId(), action: "sell" }),
        });
        if (gamRes.ok) {
          const gamData = await gamRes.json();
          if (gamData.newAchievements?.length > 0) {
            setNewAchievements(gamData.newAchievements);
          }
        }
      } catch { /* gamification non-fatal */ }
    }
    setSellingId(null);
  };

  if (!portfolio) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );

  const totalValue = getTotalValue(portfolio);
  const allocation = getAllocationByType(portfolio);
  const costBasis = portfolio.totalDeposited ?? 0;
  // Use the daily baseline sum as day-open value — this is always captured before any deposits/trades today
  const dayOpenValue = portfolio.dailyBaseline
    ? Object.values(portfolio.dailyBaseline).reduce((s, v) => s + v, 0)
    : portfolio.history[portfolio.history.length - 2]?.value ?? 0;
  const depositedToday = (portfolio.totalDeposited ?? 0) - (portfolio.baselineDeposited ?? 0);
  const dailyChange = totalValue - dayOpenValue - depositedToday;
  const dailyChangePercent = dayOpenValue > 0 ? (dailyChange / dayOpenValue) * 100 : 0;
  const totalReturn = costBasis > 0 ? totalValue - costBasis : 0;
  const totalReturnPercent = costBasis > 0 ? (totalReturn / costBasis) * 100 : 0;

  const holdingsByType = (type: string) =>
    portfolio.holdings
      .filter((h) => h.type === type && h.amount > 0)
      .map((h) => {
        const item =
          sectors.find((s) => s.id === h.id) ??
          strategies.find((s) => s.id === h.id) ??
          safeties.find((s) => s.id === h.id);
        return { name: item?.name ?? h.id, amount: h.amount };
      });

  const pieData = [
    { name: "Sectors", value: allocation.sector, color: "#6366f1", holdings: holdingsByType("sector") },
    { name: "Strategies", value: allocation.strategy, color: "#f97316", holdings: holdingsByType("strategy") },
    { name: "Safeties", value: allocation.safety, color: "#22c55e", holdings: holdingsByType("safety") },
  ].filter((d) => d.value > 0);

  const holdingDetails = portfolio.holdings
    .filter((h) => h.id !== "cash" || h.amount > 0)
    .map((h) => {
      const sector = sectors.find((s) => s.id === h.id);
      const strategy = strategies.find((s) => s.id === h.id);
      const safety = safeties.find((s) => s.id === h.id);
      const item = sector || strategy || safety;
      return {
        ...h,
        name: item?.name ?? h.id,
        color: item?.color ?? "#94a3b8",
      };
    });

  return (
    <div className="space-y-6">
      <LeaderboardSidebar open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
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
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary/80">Portfolio</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome back,{" "}
            <span className="text-gradient">{portfolio.username}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s your portfolio overview</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="lg" className="gap-2 h-10" onClick={() => setLeaderboardOpen(true)}>
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Button>
          <Link href="/advanced">
            <Button size="lg" variant="outline" className="gap-2 h-10">
              <Activity className="h-4 w-4" />
              Advanced
            </Button>
          </Link>
        </div>
      </div>

      {/* Capital One Bank */}
      <NessieBalance portfolio={portfolio} onPortfolioUpdate={setPortfolio} />

      {/* Metrics */}
      <PortfolioMetrics
        totalValue={totalValue}
        dailyChange={dailyChange}
        dailyChangePercent={dailyChangePercent}
        totalReturn={totalReturn}
        totalReturnPercent={totalReturnPercent}
        totalDeposited={costBasis}
      />

      {/* Solana Verification Badge */}
      {solanaStats.count > 0 && (
        <a
          href={solanaStats.latestUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-[#9945FF]/20 bg-gradient-to-r from-[#9945FF]/5 to-[#14F195]/5 px-5 py-3 hover:border-[#9945FF]/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9945FF]/15">
              <ShieldCheck className="h-5 w-5 text-[#9945FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#9945FF]">{solanaStats.count} trade{solanaStats.count !== 1 ? "s" : ""} verified on Solana</span>
                <Badge variant="outline" className="text-[10px] border-[#14F195]/40 text-[#14F195] bg-[#14F195]/5 px-1.5 py-0">
                  Devnet
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Every trade is recorded as an immutable memo transaction on the Solana blockchain</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#9945FF] opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View on Explorer</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </div>
        </a>
      )}

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <EquityCurve data={portfolio.history} costBasis={portfolio.totalDeposited ?? 0} />
        <AllocationPieChart data={pieData} />
      </div>

      {/* Holdings + Transactions */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Holdings */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Your Holdings</h2>
            <span className="text-xs text-muted-foreground">
              {holdingDetails.filter(h => h.id !== "cash" && h.amount > 0).length} positions
            </span>
          </div>
          <div className="p-4">
            {holdingDetails.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No holdings yet. Start investing!</p>
            ) : (
              <div className="space-y-2">
                {holdingDetails.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5 hover:border-border/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: h.color }}
                      />
                      <span className="font-medium text-sm truncate">{h.name}</span>
                      <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0.5 flex-shrink-0">
                        {h.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-sm">{formatCurrency(h.amount)}</span>
                      {h.id !== "cash" && h.amount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-[11px] px-2"
                          disabled={sellingId === h.id}
                          onClick={() => handleSell(h.id, h.amount)}
                        >
                          <ArrowDownToLine className="h-3 w-3" />
                          {sellingId === h.id ? "..." : "Sell"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Solana Transaction History */}
        <TransactionHistory />
      </div>
    </div>
  );
}
