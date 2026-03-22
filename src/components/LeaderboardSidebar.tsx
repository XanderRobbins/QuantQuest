"use client";

import { useEffect, useState } from "react";
import { X, TrendingUp, Clock, Trophy, Medal, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getUserId } from "@/lib/portfolio";
import { ACHIEVEMENTS } from "@/lib/achievements";

interface GameProfileData {
  xp: number;
  level: { level: number; name: string; xp: number; nextLevelXp: number; progress: number };
  achievements: string[];
}

interface LeaderboardEntry {
  username: string;
  totalValue: number;
  dailyChangePercent: number;
  allTimeChangePercent: number;
  tradeCount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs font-bold text-muted-foreground w-4 text-center">{rank}</span>;
}

export function LeaderboardSidebar({ open, onClose }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<"daily" | "alltime">("alltime");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<GameProfileData | null>(null);

  useEffect(() => {
    if (!open) return;

    function fetchData() {
      setLoading(true);
      fetch("/api/leaderboard")
        .then((r) => r.json())
        .then((data: LeaderboardEntry[]) => setEntries(data))
        .catch(() => {})
        .finally(() => setLoading(false));

      const userId = getUserId();
      if (userId) {
        fetch(`/api/gamification?userId=${userId}`)
          .then((r) => r.json())
          .then((data: GameProfileData) => setProfile(data))
          .catch(() => {});
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [open]);

  const sorted = [...entries].sort((a, b) =>
    sortBy === "daily"
      ? b.dailyChangePercent - a.dailyChangePercent
      : b.allTimeChangePercent - a.allTimeChangePercent
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-base">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Player Profile */}
        {profile && (
          <div className="px-4 py-3 border-b border-border/40 bg-yellow-500/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-bold uppercase tracking-wide text-yellow-600 dark:text-yellow-400">Player Profile</span>
              </div>
              <span className="text-xs font-bold bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                Lv. {profile.level.level}
              </span>
            </div>
            <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">{profile.level.name}</p>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                style={{ width: `${profile.level.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{profile.xp} / {profile.level.nextLevelXp} XP</span>
              <span className="text-[#9945FF]">{profile.achievements.length}/{ACHIEVEMENTS.length} achievements</span>
            </div>
          </div>
        )}

        {/* Toggle */}
        <div className="flex gap-1 px-4 py-3 border-b border-border/40">
          <button
            onClick={() => setSortBy("alltime")}
            className={`flex items-center gap-1.5 flex-1 justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              sortBy === "alltime"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            All Time
          </button>
          <button
            onClick={() => setSortBy("daily")}
            className={`flex items-center gap-1.5 flex-1 justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              sortBy === "daily"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Today
          </button>
        </div>

        {/* List */}
        <div key={sortBy} className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading...
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No data yet
            </div>
          ) : (
            sorted.map((entry, i) => {
              const pct = sortBy === "daily" ? entry.dailyChangePercent : entry.allTimeChangePercent;
              const isPositive = pct >= 0;
              return (
                <div
                  key={entry.username}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-border/20 hover:bg-accent/30 transition-colors ${
                    i === 0 ? "bg-yellow-500/5" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-5 flex-shrink-0">
                    <RankIcon rank={i + 1} />
                  </div>

                  {/* Avatar */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold flex-shrink-0">
                    {entry.username[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{entry.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(entry.totalValue)}
                      {entry.tradeCount > 0 && (
                        <span className="ml-1.5 text-[#9945FF]">· {entry.tradeCount} trades</span>
                      )}
                    </p>
                  </div>

                  {/* Return */}
                  <div className={`text-sm font-bold flex-shrink-0 ${isPositive ? "text-green-500" : "text-red-500"}`}>
                    {isPositive ? "+" : ""}{pct.toFixed(2)}%
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            Top {sorted.length} · Verified via <span className="text-[#9945FF]">Solana</span>
          </p>
        </div>
      </div>
    </>
  );
}
