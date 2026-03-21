"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchPortfolio, loadPortfolio, getTotalValue, getAllocationByType, type PortfolioState } from "@/lib/portfolio";
import { PortfolioMetrics } from "@/components/PortfolioMetrics";
import { EquityCurve } from "@/components/EquityCurve";
import { AllocationPieChart } from "@/components/AllocationPieChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Brain } from "lucide-react";
import Link from "next/link";
import { sectors } from "@/data/sectors";
import { strategies } from "@/data/strategies";
import { safeties } from "@/data/safeties";
import { formatCurrency } from "@/lib/utils";
import { TransactionHistory } from "@/components/TransactionHistory";
import { NessieBalance } from "@/components/NessieBalance";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);

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
  }, [router]);

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
  const startValue = portfolio.history[0]?.value ?? 10000;
  const prevValue = portfolio.history[portfolio.history.length - 2]?.value ?? totalValue;
  const dailyChange = totalValue - prevValue;
  const dailyChangePercent = (dailyChange / prevValue) * 100;
  const totalReturn = totalValue - startValue;
  const totalReturnPercent = (totalReturn / startValue) * 100;

  const pieData = [
    { name: "Sectors", value: allocation.sector, color: "#6366f1" },
    { name: "Strategies", value: allocation.strategy, color: "#f97316" },
    { name: "Safeties", value: allocation.safety, color: "#22c55e" },
  ].filter((d) => d.value > 0);

  // Build detailed holdings list
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {portfolio.username}</h1>
          <p className="text-muted-foreground">Here&apos;s your portfolio overview</p>
        </div>
        <div className="flex gap-3">
          <Link href="/invest">
            <Button size="lg" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Invest
            </Button>
          </Link>
          <Link href="/analysis">
            <Button size="lg" variant="outline" className="gap-2">
              <Brain className="h-4 w-4" />
              Analysis
            </Button>
          </Link>
        </div>
      </div>

      {/* Capital One Nessie Balance */}
      <NessieBalance />

      {/* Metrics */}
      <PortfolioMetrics
        totalValue={totalValue}
        dailyChange={dailyChange}
        dailyChangePercent={dailyChangePercent}
        totalReturn={totalReturn}
        totalReturnPercent={totalReturnPercent}
      />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EquityCurve data={portfolio.history} />
        <AllocationPieChart data={pieData} />
      </div>

      {/* Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {holdingDetails.length === 0 ? (
            <p className="text-muted-foreground text-sm">No holdings yet. Start investing!</p>
          ) : (
            <div className="space-y-3">
              {holdingDetails.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: h.color }}
                    />
                    <span className="font-medium">{h.name}</span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {h.type}
                    </Badge>
                  </div>
                  <span className="font-semibold">{formatCurrency(h.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solana Transaction History */}
      <TransactionHistory />
    </div>
  );
}
