"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  apiFetchPortfolio,
  loadPortfolio,
  savePortfolio,
  apiInvest,
  type PortfolioState,
} from "@/lib/portfolio";
import { sectors } from "@/data/sectors";
import { strategies } from "@/data/strategies";
import { safeties } from "@/data/safeties";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InvestmentCard } from "@/components/InvestmentCard";
import { InvestModal } from "@/components/InvestModal";
import { InvestmentDetailModal } from "@/components/InvestmentDetailModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  Wallet,
  Zap,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Flame,
  Star,
} from "lucide-react";
import { getUserId } from "@/lib/portfolio";
import { AchievementToast } from "@/components/AchievementToast";

interface InvestTarget {
  id: string;
  name: string;
  type: "sector" | "strategy" | "safety";
  risk: string;
}

interface SuccessToast {
  message: string;
}

interface ErrorToast {
  message: string;
}

interface MarketDataState {
  sectors: Record<string, { stocks: { symbol: string; price: number; changePercent: number }[] }>;
  updatedAt: string;
}

interface TrendingItem {
  id: string;
  name: string;
  type: "sector" | "strategy" | "safety";
  return1Y: number;
  color: string;
}

interface RecommendedItem {
  id: string;
  name: string;
  type: "sector" | "strategy" | "safety";
  reason: string;
  color: string;
  returnValue: number;
  returnLabel: string;
}

export default function InvestPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [target, setTarget] = useState<InvestTarget | null>(null);
  const [solanaToast, setSolanaToast] = useState<SuccessToast | null>(null);
  const [errorToast, setErrorToast] = useState<ErrorToast | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [marketData, setMarketData] = useState<MarketDataState | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

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

    // Fetch live market data (non-blocking)
    fetch("/api/market-data")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setMarketData(d); })
      .catch(() => {});
  }, [router]);

  // Auto-dismiss toasts after 8 seconds
  useEffect(() => {
    if (!solanaToast) return;
    const t = setTimeout(() => setSolanaToast(null), 8000);
    return () => clearTimeout(t);
  }, [solanaToast]);

  useEffect(() => {
    if (!errorToast) return;
    const t = setTimeout(() => setErrorToast(null), 6000);
    return () => clearTimeout(t);
  }, [errorToast]);

  // Compute trending: top 5 by return1Y across sectors & strategies
  const trending = useMemo<TrendingItem[]>(() => {
    const all: TrendingItem[] = [
      ...sectors.map((s) => ({
        id: s.id,
        name: s.name,
        type: "sector" as const,
        return1Y: s.return1Y,
        color: s.color,
      })),
      ...strategies.map((s) => ({
        id: s.id,
        name: s.name,
        type: "strategy" as const,
        return1Y: s.return1Y,
        color: s.color,
      })),
    ];
    return all.sort((a, b) => b.return1Y - a.return1Y).slice(0, 5);
  }, []);

  // Compute recommended: a curated mix
  const recommended = useMemo<RecommendedItem[]>(() => {
    const safePick = safeties.reduce((best, s) => (s.apy > best.apy ? s : best), safeties[0]);
    const sectorPick = sectors.find((s) => s.id === "consumer-staples") ?? sectors[0];
    const strategyPick = strategies.find((s) => s.id === "momentum") ?? strategies[0];
    const diversePick = sectors.find((s) => s.id === "real-estate") ?? sectors[1];

    return [
      {
        id: safePick.id,
        name: safePick.name,
        type: "safety" as const,
        reason: "Secure your gains",
        color: safePick.color,
        returnValue: safePick.apy,
        returnLabel: "APY",
      },
      {
        id: sectorPick.id,
        name: sectorPick.name,
        type: "sector" as const,
        reason: "Defensive stability",
        color: sectorPick.color,
        returnValue: sectorPick.return1Y,
        returnLabel: "1Y Return",
      },
      {
        id: strategyPick.id,
        name: strategyPick.name,
        type: "strategy" as const,
        reason: "High momentum play",
        color: strategyPick.color,
        returnValue: strategyPick.return1Y,
        returnLabel: "1Y Return",
      },
      {
        id: diversePick.id,
        name: diversePick.name,
        type: "sector" as const,
        reason: "Diversify your portfolio",
        color: diversePick.color,
        returnValue: diversePick.return1Y,
        returnLabel: "1Y Return",
      },
    ];
  }, []);

  if (!portfolio) return null;

  const cashHolding = portfolio.holdings.find((h) => h.id === "cash");
  const availableCash = cashHolding?.amount ?? 0;

  const openInvest = (t: InvestTarget) => {
    setTarget(t);
    setModalOpen(true);
  };

  const handleInvest = async (amount: number) => {
    if (!target || !portfolio) return;

    // Try API — portfolio updates instantly, Solana records in background
    const result = await apiInvest(target.id, target.type, amount);
    if (result) {
      setPortfolio(result.portfolio);
      setSolanaToast({ message: `Invested ${formatCurrency(amount)} in ${target.name}` });

      // Gamification — non-blocking
      try {
        const gamRes = await fetch("/api/gamification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: getUserId(),
            action: "trade",
            data: { amount, targetType: target.type },
          }),
        });
        if (gamRes.ok) {
          const gamData = await gamRes.json();
          if (gamData.newAchievements?.length > 0) {
            setNewAchievements(gamData.newAchievements);
          }
        }
      } catch { /* gamification non-fatal */ }

      return;
    }

    // Fallback to local state
    const updated = { ...portfolio, holdings: [...portfolio.holdings] };
    const cashIdx = updated.holdings.findIndex((h) => h.id === "cash");
    if (cashIdx >= 0) {
      updated.holdings[cashIdx] = {
        ...updated.holdings[cashIdx],
        amount: updated.holdings[cashIdx].amount - amount,
      };
    }
    const existingIdx = updated.holdings.findIndex((h) => h.id === target.id);
    if (existingIdx >= 0) {
      updated.holdings[existingIdx] = {
        ...updated.holdings[existingIdx],
        amount: updated.holdings[existingIdx].amount + amount,
      };
    } else {
      updated.holdings.push({ id: target.id, type: target.type, amount });
    }
    savePortfolio(updated);
    setPortfolio(updated);
  };

  return (
    <div className="space-y-6">
      {/* Achievement toast */}
      {newAchievements.length > 0 && (
        <AchievementToast
          achievementIds={newAchievements}
          onDismiss={() => setNewAchievements([])}
        />
      )}

      {/* Error toast */}
      {errorToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-xl border border-destructive/40 bg-card px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-foreground">{errorToast.message}</p>
        </div>
      )}

      {/* Success toast */}
      {solanaToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-card px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4">
          <Zap className="h-5 w-5 text-emerald-500 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">{solanaToast.message}</p>
            <p className="text-muted-foreground text-xs">Recording on Solana devnet...</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investment Marketplace</h1>
          <p className="text-muted-foreground">
            Explore sectors, strategies, and safe assets to build your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cash:</span>
          <span className="font-semibold">{formatCurrency(availableCash)}</span>
        </div>
      </div>

      {/* Category tabs — always visible at top */}
      <Tabs value={activeTab ?? ""} onValueChange={(v) => setActiveTab(v || undefined)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="sectors" className={!activeTab ? "data-[state=active]:bg-transparent" : ""}>Sectors</TabsTrigger>
          <TabsTrigger value="strategies" className={!activeTab ? "data-[state=active]:bg-transparent" : ""}>Strategies</TabsTrigger>
          <TabsTrigger value="safeties" className={!activeTab ? "data-[state=active]:bg-transparent" : ""}>Safe Assets</TabsTrigger>
        </TabsList>

        {/* Default view: Trending + Recommended when no tab selected */}
        {!activeTab && (
          <div className="space-y-6 mt-4">
            {/* Trending Today */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Trending Today</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {trending.map((item) => (
                  <div
                    key={item.id}
                    className="block min-w-[180px] flex-shrink-0 cursor-pointer"
                    onClick={() => setDetailId(item.id)}
                  >
                    <Card className="transition-all hover:shadow-md hover:border-primary/30">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-sm truncate">
                            {item.name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {item.return1Y >= 0 ? (
                            <TrendingUp className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span
                            className={`text-sm font-bold ${
                              item.return1Y >= 0 ? "text-success" : "text-destructive"
                            }`}
                          >
                            {formatPercent(item.return1Y)}
                          </span>
                          <span className="text-xs text-muted-foreground">1Y</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended For You */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Recommended For You</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recommended.map((item) => (
                  <div
                    key={item.id}
                    className="block min-w-[200px] flex-shrink-0 cursor-pointer"
                    onClick={() => setDetailId(item.id)}
                  >
                    <Card className="transition-all hover:shadow-md hover:border-primary/30">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-sm truncate">
                            {item.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          {item.reason}
                        </p>
                        <div className="flex items-center gap-1">
                          {item.returnValue >= 0 ? (
                            <TrendingUp className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span
                            className={`text-sm font-bold ${
                              item.returnValue >= 0
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {formatPercent(item.returnValue)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.returnLabel}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <TabsContent value="sectors">
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((s) => {
              const liveStocks = marketData?.sectors[s.id]?.stocks;
              const liveInfo = liveStocks?.length
                ? liveStocks.map((st) => `${st.symbol} $${st.price.toFixed(2)} (${st.changePercent >= 0 ? "+" : ""}${st.changePercent.toFixed(1)}%)`).join(" · ")
                : `${s.stocks.length} stocks: ${s.stocks.map((st) => st.symbol).join(", ")}`;
              return (
                <InvestmentCard
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  description={s.description}
                  risk={s.risk}
                  type="sector"
                  returnValue={s.return1Y}
                  returnLabel="1Y Return"
                  extraInfo={liveInfo}
                  color={s.color}
                  onInvest={() =>
                    openInvest({ id: s.id, name: s.name, type: "sector", risk: s.risk })
                  }
                  onDetail={(id) => setDetailId(id)}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="strategies">
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {strategies.map((s) => (
              <InvestmentCard
                key={s.id}
                id={s.id}
                name={s.name}
                description={s.description}
                risk={s.risk}
                type="strategy"
                returnValue={s.return1Y}
                returnLabel="1Y Return"
                extraInfo={s.howItWorks}
                color={s.color}
                onInvest={() =>
                  openInvest({ id: s.id, name: s.name, type: "strategy", risk: s.risk })
                }
                onDetail={(id) => setDetailId(id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="safeties">
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {safeties.map((s) => (
              <InvestmentCard
                key={s.id}
                id={s.id}
                name={s.name}
                description={s.description}
                risk={s.risk}
                type="safety"
                returnValue={s.apy}
                returnLabel="APY"
                color={s.color}
                onInvest={() =>
                  openInvest({ id: s.id, name: s.name, type: "safety", risk: s.risk })
                }
                onDetail={(id) => setDetailId(id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail modal overlay */}
      <InvestmentDetailModal
        investmentId={detailId}
        onClose={() => setDetailId(null)}
        onInvest={(id, name, type, risk) => {
          setDetailId(null);
          openInvest({ id, name, type, risk });
        }}
      />

      {target && (
        <InvestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          name={target.name}
          type={target.type}
          risk={target.risk}
          availableCash={availableCash}
          onConfirm={handleInvest}
        />
      )}
    </div>
  );
}
