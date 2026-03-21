"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  BarChart3,
  Shield,
  Zap,
  Brain,
  Blocks,
  Loader2,
} from "lucide-react";
import {
  apiCreatePortfolio,
  loadPortfolio,
  getDefaultPortfolio,
  savePortfolio,
  getUserId,
} from "@/lib/portfolio";

const features = [
  {
    icon: BarChart3,
    label: "Smart Sectors",
    desc: "Invest in curated baskets",
    color: "text-[#6366f1]",
  },
  {
    icon: Zap,
    label: "Quant Strategies",
    desc: "Algorithmic alpha",
    color: "text-[#f97316]",
  },
  {
    icon: Shield,
    label: "Safe Assets",
    desc: "Treasuries & more",
    color: "text-[#22c55e]",
  },
  {
    icon: Brain,
    label: "AI Analysis",
    desc: "Gemini-powered",
    color: "text-[#a855f7]",
  },
  {
    icon: Blocks,
    label: "On-Chain Trades",
    desc: "Solana verified",
    color: "text-[#9945FF]",
  },
  {
    icon: TrendingUp,
    label: "Live Portfolio",
    desc: "Real-time tracking",
    color: "text-[#06b6d4]",
  },
];

export default function LandingPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    if (!username.trim() || loading) return;
    setLoading(true);
    try {
      await apiCreatePortfolio(username.trim());
    } catch {
      const existing = loadPortfolio();
      if (!existing || existing.username !== username.trim()) {
        savePortfolio(getDefaultPortfolio(username.trim()));
      }
    }

    // Fire-and-forget Nessie account creation
    try {
      const userId = getUserId();
      fetch("/api/nessie/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username: username.trim() }),
      }).catch(() => {});
    } catch { /* non-fatal */ }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              Quant<span className="text-primary">Quest</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto">
            The investing platform built for your generation. Gamified, AI-powered, blockchain-verified.
          </p>
        </div>

        {/* Login */}
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-xl">Start Your Portfolio</CardTitle>
            <CardDescription>
              Enter your name to get <span className="font-semibold text-foreground">$10,000</span> in simulated funds — no real money needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Your name (e.g. Alex Chen)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              disabled={loading}
              className="h-11"
            />
            <Button
              className="w-full h-11 text-base font-semibold"
              onClick={handleStart}
              disabled={loading || !username.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Setting up your account...
                </>
              ) : (
                "Start Investing →"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Feature grid */}
        <div className="grid grid-cols-3 gap-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center"
              >
                <Icon className={`h-6 w-6 ${f.color}`} />
                <div>
                  <p className="text-xs font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Built for VandyHacks XII · Capital One Track · All trades are simulated
        </p>
      </div>
    </div>
  );
}
