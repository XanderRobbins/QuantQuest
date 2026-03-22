"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getUserId } from "@/lib/portfolio";

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
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-[#9945FF] shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium capitalize">{tx.investment}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-muted-foreground capitalize">{tx.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-semibold ${tx.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {tx.amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                  {tx.signature && tx.signature !== "pending" ? (
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#9945FF] hover:underline"
                      title={tx.signature}
                    >
                      {tx.signature.slice(0, 8)}…
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground italic">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      confirming
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
