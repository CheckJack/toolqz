"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART } from "@/lib/admin-charts";
import { ChartEmpty } from "@/components/admin/charts/AdminChartCard";
import { ChartTooltip } from "@/components/admin/charts/ChartTooltip";

export interface FinanceTrendRow {
  label: string;
  earnings: number;
  expenses: number;
  net: number;
}

export function FinanceTrendChart({
  data,
  height = 280,
  emptyMessage = "Add entries to see trends.",
}: {
  data: FinanceTrendRow[];
  height?: number;
  emptyMessage?: string;
}) {
  const hasValues = data.some((row) => row.earnings > 0 || row.expenses > 0);
  if (!hasValues) return <ChartEmpty message={emptyMessage} />;

  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={(value) =>
                  `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                }
              />
            }
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value) => <span className="text-xs text-muted">{value}</span>}
          />
          <Bar dataKey="earnings" name="Earnings" fill={CHART.success} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" name="Expenses" fill={CHART.danger} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line
            type="monotone"
            dataKey="net"
            name="Net"
            stroke={CHART.primary}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART.primary, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
