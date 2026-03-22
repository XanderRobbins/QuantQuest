"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, Loader2, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getUserId } from "@/lib/portfolio";

export function useSolanaStats() {
  const [stats, setStats] = useState<{ count: number; latestUrl: string | null }>({ count: 0, latestUrl: null });

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;
    fetch(`/api/transactions?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const verified = data.filter((tx: { signature: string }) => tx.signature && tx.signature !== "pending");
        setStats({
          count: verified.length,
          latestUrl: verified[0]?.explorerUrl ?? null,
        });
      })
      .catch(() => {});
  }, []);

  return stats;
}

interface TxRecord {
  _id: string;
  investment: string;
  type: string;
  amount: number;
  signature: string;
  explorerUrl: string;
  timestamp: string;
}

export function TransactionHistory() {
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTxs() {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }
    try {
      const r = await fetch(`/api/transactions?userId=${userId}`);
      const data = await r.json();
      if (Array.isArray(data)) setTxs(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    fetchTxs();
  }, []);

  // Poll every 4 seconds while any transaction is still pending
  useEffect(() => {
    const hasPending = txs.some((tx) => tx.signature === "pending");
    if (!hasPending) return;
    const interval = setInterval(fetchTxs, 4000);
    return () => clearInterval(interval);
  }, [txs]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#9945FF]" />
          <CardTitle className="text-lg">Blockchain-Verified Trades</CardTitle>
          <Badge variant="outline" className="text-xs border-[#9945FF]/50 text-[#9945FF]">
            Solana Devnet
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading transactions...</p>
        ) : txs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No on-chain transactions yet. Invest to record your first trade on Solana.
          </p>
        ) : (
          <div className="space-y-2">
            {txs.map((tx) => (
              <div
                key={tx._id ?? tx.signature}
                className="rounded-lg border border-border overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-[#9945FF] shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium capitalize">{tx.investment}</span>
                      <span className="text-muted-foreground"> · </span>
                      <span className="text-muted-foreground capitalize">{tx.type}</span>
                    </div>
                  </div>
                  <span className={`font-semibold shrink-0 ${tx.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {tx.amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
                {tx.signature && tx.signature !== "pending" ? (
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-[#9945FF]/5 border-t border-[#9945FF]/15 text-xs hover:bg-[#9945FF]/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-[#9945FF]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span className="font-medium">Verify on Chain</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="font-mono">{tx.signature.slice(0, 8)}…{tx.signature.slice(-4)}</span>
                      <ExternalLink className="h-3 w-3 text-[#9945FF]" />
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="italic">Confirming on Solana...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
