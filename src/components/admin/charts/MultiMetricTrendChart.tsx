"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART } from "@/lib/admin-charts";
import { ChartEmpty } from "@/components/admin/charts/AdminChartCard";
import { ChartTooltip } from "@/components/admin/charts/ChartTooltip";

export function MultiMetricTrendChart({
  data,
  series,
  height = 280,
  emptyMessage = "No data yet.",
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
  height?: number;
  emptyMessage?: string;
}) {
  if (!data.length) return <ChartEmpty message={emptyMessage} />;

  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={42}
          />
          <Tooltip
            content={<ChartTooltip valueFormatter={(value) => value.toLocaleString()} />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value) => <span className="text-xs text-muted">{value}</span>}
          />
          {series.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={item.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DeployActivityChart({
  data,
  height = 260,
  emptyMessage = "No deploy history yet.",
}: {
  data: {
    label: string;
    completed: number;
    failed: number;
    other: number;
  }[];
  height?: number;
  emptyMessage?: string;
}) {
  if (!data.length) return <ChartEmpty message={emptyMessage} />;

  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            content={<ChartTooltip valueFormatter={(value) => `${value} deploy${value === 1 ? "" : "s"}`} />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value) => <span className="text-xs text-muted">{value}</span>}
          />
          <Bar dataKey="completed" name="Completed" stackId="deploy" fill={CHART.success} maxBarSize={28} />
          <Bar dataKey="other" name="In progress" stackId="deploy" fill={CHART.warning} maxBarSize={28} />
          <Bar dataKey="failed" name="Failed" stackId="deploy" fill={CHART.danger} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
