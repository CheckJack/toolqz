"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART } from "@/lib/admin-charts";
import { ChartEmpty } from "@/components/admin/charts/AdminChartCard";
import { ChartTooltip } from "@/components/admin/charts/ChartTooltip";

export interface DailyAreaChartProps {
  data: { label: string; value: number; date?: string }[];
  color?: string;
  height?: number;
  emptyMessage?: string;
  valueLabel?: string;
}

export function DailyAreaChart({
  data,
  color = CHART.primary,
  height = 260,
  emptyMessage = "No data yet.",
  valueLabel = "Count",
}: DailyAreaChartProps) {
  if (!data.length) return <ChartEmpty message={emptyMessage} />;

  const gradientId = `area-${color.replace("#", "")}`;

  return (
    <div className="h-[var(--chart-h)] w-full min-w-0" style={{ ["--chart-h" as string]: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            content={
              <ChartTooltip valueFormatter={(value) => `${value.toLocaleString()} ${valueLabel.toLowerCase()}`} />
            }
            cursor={{ stroke: CHART.primary, strokeOpacity: 0.25 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={valueLabel}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
