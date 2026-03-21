"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface HoldingDetail {
  name: string;
  amount: number;
}

export interface AllocationData {
  name: string;
  value: number;
  color: string;
  holdings?: HoldingDetail[];
}

interface Props {
  data: AllocationData[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const entry: AllocationData = payload[0].payload;

  return (
    <div
      style={{
        backgroundColor: "hsl(0 0% 13%)",
        border: "1px solid hsl(0 0% 20%)",
        borderRadius: "8px",
        color: "hsl(0 0% 95%)",
        padding: "10px 14px",
        minWidth: 160,
      }}
    >
      <p className="font-semibold mb-1" style={{ color: entry.color }}>
        {entry.name}
      </p>
      <p className="text-sm mb-2">{formatCurrency(entry.value)}</p>
      {entry.holdings && entry.holdings.length > 0 && (
        <div className="border-t border-white/10 pt-2 space-y-1">
          {entry.holdings.map((h) => (
            <div key={h.name} className="flex justify-between gap-4 text-xs">
              <span className="text-gray-300">{h.name}</span>
              <span className="font-medium">{formatCurrency(h.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function AllocationPieChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) =>
                  `${name} ${((value / total) * 100).toFixed(0)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
