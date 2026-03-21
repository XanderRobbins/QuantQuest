"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getUserId } from "@/lib/portfolio";

interface NessieData {
  accountId: string;
  balance: number;
}

export function NessieBalance() {
  const [data, setData] = useState<NessieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const fetchBalance = async () => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }

    try {
      const res = await fetch(`/api/nessie/account?userId=${userId}`);
      if (res.status === 503) { setUnavailable(true); setLoading(false); return; }
      if (res.ok) {
        const json = await res.json();
        setData({ accountId: json.accountId, balance: json.balance });
      }
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBalance(); }, []);

  if (unavailable) return null; // Don't show if Nessie isn't configured

  return (
    <Card className="border-[#D03027]/20 bg-[#D03027]/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#D03027]" />
            <span className="font-semibold text-sm">Capital One Account</span>
            <Badge
              variant="outline"
              className="text-xs border-[#D03027]/40 text-[#D03027]"
            >
              Nessie
            </Badge>
          </div>
          <button
            onClick={() => { setLoading(true); fetchBalance(); }}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          ) : data ? (
            <div>
              <span className="text-2xl font-bold text-[#D03027]">
                {formatCurrency(data.balance)}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Account {data.accountId.slice(-8).toUpperCase()} · Checking
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Account not found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
