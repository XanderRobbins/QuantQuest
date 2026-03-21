"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface Props {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export function PortfolioMetrics({
  totalValue,
  dailyChange,
  dailyChangePercent,
  totalReturn,
  totalReturnPercent,
}: Props) {
  const metrics = [
    {
      label: "Portfolio Value",
      value: formatCurrency(totalValue),
      icon: DollarSign,
      color: "text-primary",
    },
    {
      label: "Daily Change",
      value: `${formatCurrency(Math.abs(dailyChange))}`,
      sub: formatPercent(dailyChangePercent),
      icon: dailyChange >= 0 ? TrendingUp : TrendingDown,
      color: dailyChange >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: "Total Return",
      value: `${formatCurrency(Math.abs(totalReturn))}`,
      sub: formatPercent(totalReturnPercent),
      icon: totalReturn >= 0 ? TrendingUp : TrendingDown,
      color: totalReturn >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: "Positions",
      value: "Active",
      icon: Activity,
      color: "text-chart-2",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{m.label}</span>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <div className="mt-2">
                <span className={`text-2xl font-bold ${m.color}`}>{m.value}</span>
                {m.sub && (
                  <span className={`ml-2 text-sm ${m.color}`}>{m.sub}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
