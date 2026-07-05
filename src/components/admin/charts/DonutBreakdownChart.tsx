"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartEmpty } from "@/components/admin/charts/AdminChartCard";
import { ChartTooltip } from "@/components/admin/charts/ChartTooltip";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export function DonutBreakdownChart({
  data,
  height = 260,
  emptyMessage = "No data yet.",
  valueLabel = "Count",
}: {
  data: DonutSlice[];
  height?: number;
  emptyMessage?: string;
  valueLabel?: string;
}) {
  const filtered = data.filter((d) => d.value > 0);
  if (!filtered.length) return <ChartEmpty message={emptyMessage} />;

  const total = filtered.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="relative w-full min-w-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="transparent"
            >
              {filtered.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(value) => {
                    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                    return `${value.toLocaleString()} (${pct}%)`;
                  }}
                />
              }
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-muted">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
          <p className="text-2xl font-bold tabular-nums text-white">{total.toLocaleString()}</p>
          <p className="text-[11px] text-muted">{valueLabel}</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm lg:min-w-[9rem]">
        {filtered.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
              {row.name}
            </span>
            <span className="font-semibold tabular-nums text-white">
              {total > 0 ? `${Math.round((row.value / total) * 100)}%` : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
