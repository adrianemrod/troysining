"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPHP } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-sm font-bold text-foreground">{formatPHP(payload[0].value)}</p>
    </div>
  );
}

export function MonthlyTrendChart({ data, barColor = "#e08b2e" }: { data: DataPoint[]; barColor?: string }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e9ee" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7684" }} axisLine={{ stroke: "#e6e9ee" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "#6b7684" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`)}
            width={56}
          />
          <Tooltip cursor={{ fill: "#f6f7f9" }} content={<CustomTooltip />} />
          <Bar dataKey="value" fill={barColor} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
