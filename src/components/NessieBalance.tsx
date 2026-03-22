"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  RefreshCw,
  ArrowUpFromLine,
  ArrowDownToLine,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getUserId, savePortfolio, apiFetchPortfolio, getTotalValue, type PortfolioState } from "@/lib/portfolio";

interface NessieData {
  accountId: string;
  balance: number;
}

interface TransferModalState {
  open: boolean;
  direction: "deposit" | "withdraw";
}

interface Props {
  portfolio: PortfolioState;
  onPortfolioUpdate: (portfolio: PortfolioState) => void;
}

export function NessieBalance({ portfolio, onPortfolioUpdate }: Props) {
  const [data, setData] = useState<NessieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [modal, setModal] = useState<TransferModalState>({
    open: false,
    direction: "deposit",
  });
  const [amount, setAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const cashHolding = portfolio.holdings.find((h) => h.id === "cash");
  const portfolioCash = cashHolding?.amount ?? 0;
  const totalPortfolioValue = getTotalValue(portfolio);

  const fetchBalance = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/nessie/account?userId=${userId}`);
      if (res.status === 503) {
        setUnavailable(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData({ accountId: json.accountId, balance: json.balance });
      }
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!transferSuccess) return;
    const t = setTimeout(() => setTransferSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [transferSuccess]);

  const openTransfer = (direction: "deposit" | "withdraw") => {
    setModal({ open: true, direction });
    setAmount("");
    setTransferError(null);
    setTransferSuccess(null);
  };

  const handleTransfer = async () => {
    if (!data || !amount || transferring) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setTransferError("Enter a valid amount");
      return;
    }

    if (modal.direction === "deposit" && numAmount > data.balance) {
      setTransferError(`Insufficient bank balance. Available: ${formatCurrency(data.balance)}`);
      return;
    }
    if (modal.direction === "withdraw" && numAmount > portfolioCash) {
      setTransferError(`Insufficient portfolio cash. Available: ${formatCurrency(portfolioCash)}`);
      return;
    }

    setTransferring(true);
    setTransferError(null);

    try {
      const res = await fetch("/api/nessie/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getUserId(),
          accountId: data.accountId,
          amount: numAmount,
          direction: modal.direction,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setTransferError(err.error ?? "Transfer failed");
        setTransferring(false);
        return;
      }

      const result = await res.json();

      // Update bank balance
      if (result.bankBalance >= 0) {
        setData({ ...data, balance: result.bankBalance });
      }

      // Fetch fresh portfolio so the GET route's live-patched history (including new cash) is used
      const freshPortfolio = await apiFetchPortfolio();
      if (freshPortfolio) {
        onPortfolioUpdate(freshPortfolio);
      } else {
        // Fallback: use transfer response
        const updatedPortfolio: PortfolioState = {
          userId: result.portfolio.userId,
          username: result.portfolio.username,
          holdings: result.portfolio.holdings,
          history: result.portfolio.history,
          totalDeposited: result.portfolio.totalDeposited ?? 0,
          baselineDeposited: result.portfolio.baselineDeposited ?? portfolio.baselineDeposited ?? 0,
          dailyBaseline: result.portfolio.dailyBaseline ?? portfolio.dailyBaseline ?? null,
        };
        savePortfolio(updatedPortfolio);
        onPortfolioUpdate(updatedPortfolio);
      }

      setTransferSuccess(
        modal.direction === "deposit"
          ? `Deposited ${formatCurrency(numAmount)} to portfolio`
          : `Withdrew ${formatCurrency(numAmount)} to bank`
      );
      setModal({ ...modal, open: false });
    } catch {
      setTransferError("Connection error. Please try again.");
    } finally {
      setTransferring(false);
    }
  };

  if (unavailable) return null;

  const presets =
    modal.direction === "deposit"
      ? [100, 500, 1000, Math.floor(data?.balance ?? 0)]
      : [100, 500, 1000, Math.floor(portfolioCash)];

  return (
    <>
      <Card className="border-[#D03027]/20 bg-[#D03027]/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#D03027]" />
              <span className="font-semibold text-sm">Capital One Bank</span>
              <Badge
                variant="outline"
                className="text-xs border-[#D03027]/40 text-[#D03027]"
              >
                Nessie API
              </Badge>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchBalance();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="mt-3 flex items-end justify-between">
            {loading ? (
              <div className="h-8 w-32 rounded bg-muted animate-pulse" />
            ) : data ? (
              <div>
                <span className="text-2xl font-bold text-[#D03027]">
                  {formatCurrency(data.balance)}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Account {data.accountId.slice(-8).toUpperCase()} &middot; Checking
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Account not found</p>
            )}

            {data && !loading && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-[#D03027]/30 text-[#D03027] hover:bg-[#D03027]/10"
                  onClick={() => openTransfer("deposit")}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  Deposit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-[#D03027]/30 text-[#D03027] hover:bg-[#D03027]/10"
                  onClick={() => openTransfer("withdraw")}
                >
                  <ArrowUpFromLine className="h-3.5 w-3.5" />
                  Withdraw
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transfer success toast */}
      {transferSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-card px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4">
          <Building2 className="h-5 w-5 text-[#D03027] shrink-0" />
          <p className="text-sm font-medium text-foreground">{transferSuccess}</p>
        </div>
      )}

      {/* Transfer modal */}
      <Dialog open={modal.open} onOpenChange={(o) => !o && setModal({ ...modal, open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#D03027]" />
              {modal.direction === "deposit"
                ? "Deposit to Portfolio"
                : "Withdraw to Bank"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Flow visualization */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {modal.direction === "deposit" ? "Bank" : "Cash Available"}
                </p>
                <p className="font-semibold">
                  {formatCurrency(
                    modal.direction === "deposit"
                      ? (data?.balance ?? 0)
                      : portfolioCash
                  )}
                </p>
              </div>
              <div className="text-muted-foreground px-3">→</div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {modal.direction === "deposit" ? "Portfolio Total" : "Bank"}
                </p>
                <p className="font-semibold">
                  {formatCurrency(
                    modal.direction === "deposit"
                      ? totalPortfolioValue
                      : (data?.balance ?? 0)
                  )}
                </p>
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setTransferError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleTransfer()}
                  className="pl-7 h-11"
                  min={0}
                  step={0.01}
                />
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-2 flex-wrap">
              {presets
                .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                .map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setAmount(val.toString());
                      setTransferError(null);
                    }}
                  >
                    {val === presets[presets.length - 1] ? "Max" : formatCurrency(val)}
                  </Button>
                ))}
            </div>

            {transferError && (
              <p className="text-sm text-destructive">{transferError}</p>
            )}

            <Button
              className="w-full h-11"
              onClick={handleTransfer}
              disabled={transferring || !amount}
            >
              {transferring
                ? "Processing..."
                : modal.direction === "deposit"
                ? "Deposit to Portfolio"
                : "Withdraw to Bank"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
