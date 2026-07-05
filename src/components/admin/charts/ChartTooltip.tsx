"use client";

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
  valueFormatter?: (value: number, name: string) => string;
}

export function ChartTooltip({
  active,
  label,
  payload,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-dark-border bg-dark-elevated px-3 py-2 text-xs shadow-xl shadow-black/40">
      {label && <p className="mb-1.5 font-medium text-white">{label}</p>}
      <ul className="space-y-1">
        {payload.map((item) => {
          const name = String(item.name ?? item.dataKey ?? "");
          const raw = Number(item.value ?? 0);
          const display = valueFormatter
            ? valueFormatter(raw, name)
            : raw.toLocaleString();
          return (
            <li key={name} className="flex items-center gap-2 text-muted">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color ?? "#6db4e8" }}
              />
              <span className="text-white/90">{name}</span>
              <span className="ml-auto font-semibold tabular-nums text-white">{display}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
