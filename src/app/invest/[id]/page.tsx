"use client";

import { useParams, useRouter } from "next/navigation";
import { sectors, type Sector } from "@/data/sectors";
import { strategies, type Strategy } from "@/data/strategies";
import { safeties, type Safety } from "@/data/safeties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/utils";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  BarChart3,
  Lightbulb,
  Percent,
} from "lucide-react";

type InvestmentItem =
  | { type: "sector"; data: Sector }
  | { type: "strategy"; data: Strategy }
  | { type: "safety"; data: Safety }
  | null;

function findInvestment(id: string): InvestmentItem {
  const sector = sectors.find((s) => s.id === id);
  if (sector) return { type: "sector", data: sector };

  const strategy = strategies.find((s) => s.id === id);
  if (strategy) return { type: "strategy", data: strategy };

  const safety = safeties.find((s) => s.id === id);
  if (safety) return { type: "safety", data: safety };

  return null;
}

function riskExplanation(risk: string): string {
  switch (risk) {
    case "Very Low":
      return "Minimal chance of losing money. Capital is highly preserved with stable, predictable returns.";
    case "Low":
      return "Small potential for short-term losses. Generally stable with modest fluctuations in value.";
    case "Medium":
      return "Moderate price swings expected. Could see temporary drawdowns of 10-20% during market stress.";
    case "High":
      return "Significant volatility. Drawdowns of 20-40%+ are possible, but higher long-term return potential.";
    default:
      return "";
  }
}

export default function InvestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const item = findInvestment(id);

  if (!item) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/invest")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
        </Button>
        <p className="text-muted-foreground">Investment not found.</p>
      </div>
    );
  }

  const { type, data } = item;
  const risk = data.risk;
  const riskVariant =
    risk === "High"
      ? "destructive"
      : risk === "Medium"
      ? "warning"
      : "success";

  const typeBadgeColor =
    type === "sector"
      ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
      : type === "strategy"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/invest")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <Badge className={typeBadgeColor} variant="outline">
            {type === "sector"
              ? "Sector"
              : type === "strategy"
              ? "Strategy"
              : "Safe Asset"}
          </Badge>
        </div>
        <Badge variant={riskVariant} className="text-sm px-3 py-1">
          {risk} Risk
        </Badge>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground leading-relaxed text-base">
            {data.description}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Risk */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{risk}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {riskExplanation(risk)}
            </p>
          </CardContent>
        </Card>

        {/* Returns */}
        {type !== "safety" && "return1Y" in data && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> 1-Year Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {(data as Sector | Strategy).return1Y >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      (data as Sector | Strategy).return1Y >= 0
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {formatPercent((data as Sector | Strategy).return1Y)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> YTD Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {(data as Sector | Strategy).returnYTD >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      (data as Sector | Strategy).returnYTD >= 0
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {formatPercent((data as Sector | Strategy).returnYTD)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* APY for safety */}
        {type === "safety" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" /> APY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-success">
                {formatPercent((data as Safety).apy)}
              </span>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sector: Stock holdings */}
      {type === "sector" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data as Sector).stocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                >
                  <div>
                    <span className="font-mono font-semibold text-sm">
                      {stock.symbol}
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {stock.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${stock.weight}%`,
                          backgroundColor: data.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">
                      {stock.weight}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy: How it works */}
      {type === "strategy" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" /> How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {(data as Strategy).howItWorks}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invest button */}
      <div className="flex gap-3">
        <Button
          size="lg"
          className="px-8"
          onClick={() => router.push("/invest")}
        >
          Invest in {data.name}
        </Button>
      </div>
    </div>
  );
}
