"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART } from "@/lib/admin-charts";
import { ChartEmpty } from "@/components/admin/charts/AdminChartCard";
import { ChartTooltip } from "@/components/admin/charts/ChartTooltip";

export interface HorizontalBarChartProps {
  data: { name: string; fullName?: string; value: number; color?: string }[];
  height?: number;
  emptyMessage?: string;
  valueLabel?: string;
  defaultColor?: string;
}

export function HorizontalBarChart({
  data,
  height = 280,
  emptyMessage = "No data yet.",
  valueLabel = "Count",
  defaultColor = CHART.primary,
}: HorizontalBarChartProps) {
  if (!data.length) return <ChartEmpty message={emptyMessage} />;

  const chartHeight = Math.max(height, data.length * 36 + 48);

  return (
    <div className="w-full min-w-0" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={108}
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={(value) => `${value.toLocaleString()} ${valueLabel.toLowerCase()}`}
              />
            }
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="value" name={valueLabel} radius={[0, 6, 6, 0]} maxBarSize={22}>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={entry.color ?? defaultColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
