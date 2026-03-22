"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUserId, loadPortfolio } from "@/lib/portfolio";
import { sectors } from "@/data/sectors";
import { strategies } from "@/data/strategies";
import { safeties } from "@/data/safeties";
import { scenarios, timeframeLabels, type Timeframe } from "@/data/scenarios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Trophy,
  ArrowLeft,
  Crown,
  Medal,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  ArrowDownRight,
  LogOut,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Holding {
  assetId: string;
  assetType: string;
  amount: number;
}

interface Participant {
  userId: string;
  username: string;
  cash: number;
  holdings: Holding[];
  valueHistory: { day: number; value: number }[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalValue: number;
  returnPct: number;
}

interface CompetitionData {
  _id: string;
  type: string;
  scenario: string | null;
  name: string;
  timeframe: string;
  startingCash: number;
  currentDay: number;
  totalDays: number;
  startedAt: string;
  status: string;
  inviteCode: string | null;
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
}

const LINE_COLORS = [
  "#6366f1", "#f97316", "#22c55e", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#eab308",
];

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs text-muted-foreground font-mono w-4 text-center">{rank}</span>;
};

// Asset name lookup
function getAssetName(assetId: string): string {
  const s = sectors.find((x) => x.id === assetId);
  if (s) return s.name;
  const st = strategies.find((x) => x.id === assetId);
  if (st) return st.name;
  const sa = safeties.find((x) => x.id === assetId);
  if (sa) return sa.name;
  return assetId;
}

type AssetInfo = { id: string; name: string; type: "sector" | "strategy" | "safety"; risk: string };

const allAssets: AssetInfo[] = [
  ...sectors.map((s) => ({ id: s.id, name: s.name, type: "sector" as const, risk: s.risk })),
  ...strategies.map((s) => ({ id: s.id, name: s.name, type: "strategy" as const, risk: s.risk })),
  ...safeties.map((s) => ({ id: s.id, name: s.name, type: "safety" as const, risk: s.risk })),
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CompetitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const compId = params.id as string;
  const userId = getUserId();

  const [comp, setComp] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradeTab, setTradeTab] = useState<"sector" | "strategy" | "safety">("sector");
  const [buyAmounts, setBuyAmounts] = useState<Record<string, string>>({});
  const [sellAmounts, setSellAmounts] = useState<Record<string, string>>({});
  const [trading, setTrading] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Auth check
  useEffect(() => {
    const p = loadPortfolio();
    if (!p) router.push("/");
  }, [router]);

  // Fetch competition data
  const fetchComp = useCallback(async () => {
    try {
      const res = await fetch(`/api/competitions/${compId}`);
      if (!res.ok) { router.push("/competition"); return; }
      const data = await res.json();
      setComp(data);
    } catch { router.push("/competition"); }
    finally { setLoading(false); }
  }, [compId, router]);

  useEffect(() => { fetchComp(); }, [fetchComp]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchComp, 30000);
    return () => clearInterval(interval);
  }, [fetchComp]);

  // Current user's participant data
  const me = useMemo(
    () => comp?.participants.find((p) => p.userId === userId) ?? null,
    [comp, userId]
  );

  const myTotalValue = useMemo(
    () => me ? Math.round((me.cash + me.holdings.reduce((s, h) => s + h.amount, 0)) * 100) / 100 : 0,
    [me]
  );

  const myReturn = comp ? Math.round(((myTotalValue - comp.startingCash) / comp.startingCash) * 10000) / 100 : 0;

  const scenarioInfo = comp?.scenario ? scenarios.find((s) => s.id === comp.scenario) : null;
  const isCompleted = comp?.status === "completed";
  const daysRemaining = comp ? Math.max(0, comp.totalDays - comp.currentDay) : 0;
  const progressPct = comp ? Math.round((comp.currentDay / comp.totalDays) * 100) : 0;

  // ─── Trade handlers ──────────────────────────────────────────────────────

  async function handleBuy(assetId: string, assetType: string) {
    const amount = parseFloat(buyAmounts[assetId] ?? "0");
    if (!amount || amount <= 0) return;
    setTrading(assetId);
    setTradeError(null);
    try {
      const res = await fetch(`/api/competitions/${compId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy", userId, assetId, assetType, amount }),
      });
      const data = await res.json();
      if (!res.ok) { setTradeError(data.error); return; }
      setBuyAmounts((p) => ({ ...p, [assetId]: "" }));
      fetchComp();
    } catch { setTradeError("Trade failed"); }
    finally { setTrading(null); }
  }

  async function handleSell(assetId: string) {
    const amount = parseFloat(sellAmounts[assetId] ?? "0");
    if (!amount || amount <= 0) return;
    setTrading(assetId);
    setTradeError(null);
    try {
      const res = await fetch(`/api/competitions/${compId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sell", userId, assetId, amount }),
      });
      const data = await res.json();
      if (!res.ok) { setTradeError(data.error); return; }
      setSellAmounts((p) => ({ ...p, [assetId]: "" }));
      fetchComp();
    } catch { setTradeError("Trade failed"); }
    finally { setTrading(null); }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this competition?")) return;
    setLeaving(true);
    try {
      await fetch(`/api/competitions/${compId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", userId }),
      });
      router.push("/competition");
    } catch { /* */ }
    finally { setLeaving(false); }
  }

  // ─── Chart data ──────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    if (!comp || comp.participants.length < 2) return null;

    const dayMap = new Map<number, Record<string, number>>();
    for (const p of comp.participants) {
      for (const snap of p.valueHistory) {
        const row = dayMap.get(snap.day) ?? { day: snap.day };
        row[p.userId] = snap.value;
        dayMap.set(snap.day, row);
      }
    }

    const data = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
    const lines = comp.participants.map((p, i) => ({
      userId: p.userId,
      username: p.username,
      color: LINE_COLORS[i % LINE_COLORS.length],
    }));

    return { data, lines };
  }, [comp]);

  // ─── Filtered trade assets ───────────────────────────────────────────────

  const tradeAssets = useMemo(
    () => allAssets.filter((a) => a.type === tradeTab),
    [tradeTab]
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading || !comp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push("/competition")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Competitions
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">{comp.name}</h1>
              {isCompleted && (
                <Badge className="bg-muted text-muted-foreground">Completed</Badge>
              )}
            </div>
            {scenarioInfo && (
              <p className="text-sm text-muted-foreground">{scenarioInfo.tagline}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {comp.inviteCode && (
              <div className="rounded-lg border border-border px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono font-bold tracking-widest">{comp.inviteCode}</span>
              </div>
            )}
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {leaving ? "Leaving..." : "Leave"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Day {comp.currentDay} of {comp.totalDays}
              {" · "}
              {timeframeLabels[comp.timeframe as Timeframe]}
            </span>
            <span className="text-muted-foreground">
              {isCompleted ? "Finished" : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-accent/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Portfolio + Trading (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Portfolio summary */}
          {me && (
            <div className="grid gap-3 grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-xl font-bold">{formatCurrency(myTotalValue)}</p>
                  <p className={`text-sm font-semibold ${myReturn >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {myReturn >= 0 ? <TrendingUp className="inline h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="inline h-3.5 w-3.5 mr-0.5" />}
                    {formatPercent(myReturn)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Cash</p>
                  <p className="text-xl font-bold">{formatCurrency(me.cash)}</p>
                  <p className="text-xs text-muted-foreground">Available to trade</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Your Rank</p>
                  <p className="text-xl font-bold">
                    #{comp.leaderboard.find((l) => l.userId === userId)?.rank ?? "–"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {comp.participants.length} player{comp.participants.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Holdings */}
          {me && me.holdings.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  Your Holdings
                </h3>
                <div className="divide-y divide-border">
                  {me.holdings.map((h) => (
                    <div key={h.assetId} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">{getAssetName(h.assetId)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{h.assetType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatCurrency(h.amount)}</span>
                        {!isCompleted && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={sellAmounts[h.assetId] ?? ""}
                              onChange={(e) =>
                                setSellAmounts((p) => ({ ...p, [h.assetId]: e.target.value }))
                              }
                              placeholder="$"
                              className="w-20 rounded-md border border-border bg-card px-2 py-1 text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                              onClick={() => handleSell(h.assetId)}
                              disabled={trading === h.assetId}
                              className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                              <ArrowDownRight className="h-3 w-3 inline mr-0.5" />
                              Sell
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trade interface */}
          {!isCompleted && me && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  Buy Assets
                  <span className="text-xs text-muted-foreground font-normal ml-auto">
                    Cash: {formatCurrency(me.cash)}
                  </span>
                </h3>

                {tradeError && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600">
                    {tradeError}
                  </div>
                )}

                {/* Asset type tabs */}
                <div className="flex gap-1 rounded-lg bg-accent/40 p-1">
                  {([["sector", "Sectors"], ["strategy", "Strategies"], ["safety", "Safe Assets"]] as const).map(
                    ([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setTradeTab(key)}
                        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                          tradeTab === key
                            ? "bg-card shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>

                <div className="grid gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {tradeAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.risk} risk</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            $
                          </span>
                          <input
                            type="number"
                            value={buyAmounts[asset.id] ?? ""}
                            onChange={(e) =>
                              setBuyAmounts((p) => ({ ...p, [asset.id]: e.target.value }))
                            }
                            placeholder="0"
                            className="w-24 rounded-md border border-border bg-card px-2 py-1 pl-5 text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <button
                          onClick={() => handleBuy(asset.id, asset.type)}
                          disabled={
                            trading === asset.id ||
                            !buyAmounts[asset.id] ||
                            parseFloat(buyAmounts[asset.id]) <= 0
                          }
                          className="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Leaderboard + Chart (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Leaderboard */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                Leaderboard
              </h3>
              <div className="divide-y divide-border">
                {comp.leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between py-2.5 ${
                      entry.userId === userId ? "font-medium" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {rankIcon(entry.rank)}
                      <div>
                        <span className="text-sm truncate">
                          {entry.username}
                          {entry.userId === userId && (
                            <span className="text-primary text-xs ml-1">(you)</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(entry.totalValue)}</p>
                      <p
                        className={`text-xs font-semibold ${
                          entry.returnPct >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatPercent(entry.returnPct)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance chart */}
          {chartData && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold">Performance</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(d: number) => `D${d}`}
                      stroke="var(--color-muted-foreground)"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                      stroke="var(--color-muted-foreground)"
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      formatter={(value, name) => {
                        if (value == null) return ["-", ""];
                        const line = chartData.lines.find((l) => l.userId === (name as string));
                        return [formatCurrency(value as number), line?.username ?? (name as string)];
                      }}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px" }}
                      formatter={(value: string) => {
                        const line = chartData.lines.find((l) => l.userId === value);
                        return line?.username ?? value;
                      }}
                    />
                    {chartData.lines.map((line) => (
                      <Line
                        key={line.userId}
                        type="monotone"
                        dataKey={line.userId}
                        stroke={line.color}
                        strokeWidth={2}
                        dot={false}
                        name={line.userId}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
