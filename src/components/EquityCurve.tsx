"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: { date: string; value: number }[];
  costBasis?: number;
}

/** Simple seeded pseudo-random for deterministic noise */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function EquityCurve({ data, costBasis = 0 }: Props) {
  const lastValue = data[data.length - 1]?.value ?? 0;
  const isPositive = costBasis > 0 ? lastValue >= costBasis : (data.length >= 2 && lastValue >= data[0].value);
  const color = isPositive ? "#22c55e" : "#ef4444";

  const { combined, todayDate } = useMemo(() => {
    if (data.length === 0) return { combined: [], todayDate: "" };

    const lastPoint = data[data.length - 1];
    const lastValue = lastPoint.value;
    const lastDate = new Date(lastPoint.date);
    const todayStr = lastPoint.date;

    // Daily growth rates from annualized returns
    const highDaily = Math.pow(1 + 0.15, 1 / 365) - 1;
    const expectedDaily = Math.pow(1 + 0.08, 1 / 365) - 1;
    const lowDaily = Math.pow(1 - 0.05, 1 / 365) - 1;

    const rngHigh = seededRandom(42);
    const rngExp = seededRandom(137);
    const rngLow = seededRandom(256);

    // Build historical rows (no projection fields)
    const historicalRows = data.map((d) => ({
      date: d.date,
      value: d.value,
      projHigh: undefined as number | undefined,
      projExpected: undefined as number | undefined,
      projLow: undefined as number | undefined,
    }));

    // The last historical point also seeds the projection lines
    historicalRows[historicalRows.length - 1].projHigh = lastValue;
    historicalRows[historicalRows.length - 1].projExpected = lastValue;
    historicalRows[historicalRows.length - 1].projLow = lastValue;

    // Build 30 days of projection
    let highVal = lastValue;
    let expVal = lastValue;
    let lowVal = lastValue;
    const projectionRows: typeof historicalRows = [];

    for (let i = 1; i <= 30; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      // noise: gaussian-ish from uniform
      const noiseH = (rngHigh() - 0.5) * 0.008;
      const noiseE = (rngExp() - 0.5) * 0.006;
      const noiseL = (rngLow() - 0.5) * 0.008;

      highVal *= 1 + highDaily + noiseH;
      expVal *= 1 + expectedDaily + noiseE;
      lowVal *= 1 + lowDaily + noiseL;

      projectionRows.push({
        date: dateStr,
        value: undefined as unknown as number,
        projHigh: Math.round(highVal * 100) / 100,
        projExpected: Math.round(expVal * 100) / 100,
        projLow: Math.round(lowVal * 100) / 100,
      });
    }

    return {
      combined: [...historicalRows, ...projectionRows],
      todayDate: todayStr,
    };
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Equity Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combined}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "hsl(0 0% 60%)" }}
                tickFormatter={(d) => {
                  const date = new Date(d);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(0 0% 60%)" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0 0% 13%)",
                  border: "1px solid hsl(0 0% 20%)",
                  borderRadius: "8px",
                  color: "hsl(0 0% 95%)",
                }}
                formatter={(value, name) => {
                  if (value == null) return ["-", ""];
                  const labels: Record<string, string> = {
                    value: "Actual",
                    projHigh: "High (+15%)",
                    projExpected: "Expected (+8%)",
                    projLow: "Low (-5%)",
                  };
                  return [formatCurrency(value as number), labels[name as string] ?? name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    value: "Actual",
                    projHigh: "High (+15%)",
                    projExpected: "Expected (+8%)",
                    projLow: "Low (-5%)",
                  };
                  return labels[value] ?? value;
                }}
              />

              {/* Cost basis reference line */}
              {costBasis > 0 && (
                <ReferenceLine
                  y={costBasis}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Deposited ${formatCurrency(costBasis)}`,
                    position: "insideTopRight",
                    fill: "#94a3b8",
                    fontSize: 11,
                  }}
                />
              )}

              {/* Vertical divider at "today" */}
              {todayDate && (
                <ReferenceLine
                  x={todayDate}
                  stroke="hsl(0 0% 50%)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: "Today",
                    position: "top",
                    fill: "hsl(0 0% 60%)",
                    fontSize: 11,
                  }}
                />
              )}

              {/* Historical area */}
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                connectNulls={false}
                dot={false}
                legendType="square"
              />

              {/* Projection lines */}
              <Line
                type="monotone"
                dataKey="projHigh"
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
                legendType="plainline"
              />
              <Line
                type="monotone"
                dataKey="projExpected"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
                legendType="plainline"
              />
              <Line
                type="monotone"
                dataKey="projLow"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
                legendType="plainline"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
