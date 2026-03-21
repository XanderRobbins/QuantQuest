"use client";

import { useEffect, useState } from "react";
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
import { formatCurrency } from "@/lib/utils";
import { Wallet, ExternalLink, Zap } from "lucide-react";
import { getUserId } from "@/lib/portfolio";

interface InvestTarget {
  id: string;
  name: string;
  type: "sector" | "strategy" | "safety";
  risk: string;
}

interface SolanaToast {
  signature: string;
  explorerUrl: string;
}

export default function InvestPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [target, setTarget] = useState<InvestTarget | null>(null);
  const [solanaToast, setSolanaToast] = useState<SolanaToast | null>(null);

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

  // Auto-dismiss Solana toast after 8 seconds
  useEffect(() => {
    if (!solanaToast) return;
    const t = setTimeout(() => setSolanaToast(null), 8000);
    return () => clearTimeout(t);
  }, [solanaToast]);

  if (!portfolio) return null;

  const cashHolding = portfolio.holdings.find((h) => h.id === "cash");
  const availableCash = cashHolding?.amount ?? 0;

  const openInvest = (t: InvestTarget) => {
    setTarget(t);
    setModalOpen(true);
  };

  const handleInvest = async (amount: number) => {
    if (!target || !portfolio) return;

    // Try API (includes Solana recording)
    const result = await apiInvest(target.id, target.type, amount);
    if (result) {
      setPortfolio(result.portfolio);
      if (result.solana) {
        setSolanaToast(result.solana);
      }

      // Fire-and-forget Nessie withdrawal to reflect funds leaving the account
      try {
        const userId = getUserId();
        const nessieRes = await fetch(`/api/nessie/account?userId=${userId}`);
        if (nessieRes.ok) {
          const nessie = await nessieRes.json();
          fetch("/api/nessie/deposit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountId: nessie.accountId,
              amount,
              description: `Invested in ${target.name}`,
            }),
          }).catch(() => {});
        }
      } catch { /* non-fatal */ }

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
      {/* Solana confirmation toast */}
      {solanaToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-[#9945FF]/40 bg-card px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4">
          <Zap className="h-5 w-5 text-[#9945FF] shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Trade recorded on Solana</p>
            <p className="text-muted-foreground text-xs font-mono">
              {solanaToast.signature.slice(0, 16)}…
            </p>
          </div>
          <a
            href={solanaToast.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-[#9945FF] hover:text-[#9945FF]/80"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
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

      <Tabs defaultValue="sectors">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="sectors">Sectors</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="safeties">Safeties</TabsTrigger>
        </TabsList>

        <TabsContent value="sectors">
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((s) => (
              <InvestmentCard
                key={s.id}
                name={s.name}
                description={s.description}
                risk={s.risk}
                type="sector"
                returnValue={s.return1Y}
                returnLabel="1Y Return"
                extraInfo={`${s.stocks.length} stocks: ${s.stocks.map((st) => st.symbol).join(", ")}`}
                color={s.color}
                onInvest={() =>
                  openInvest({ id: s.id, name: s.name, type: "sector", risk: s.risk })
                }
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="strategies">
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {strategies.map((s) => (
              <InvestmentCard
                key={s.id}
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
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="safeties">
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {safeties.map((s) => (
              <InvestmentCard
                key={s.id}
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
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

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
