export const CHART = {
  primary: "#6db4e8",
  primarySoft: "rgba(109, 180, 232, 0.22)",
  success: "#34d399",
  successSoft: "rgba(52, 211, 153, 0.22)",
  danger: "#f87171",
  dangerSoft: "rgba(248, 113, 113, 0.22)",
  warning: "#fbbf24",
  warningSoft: "rgba(251, 191, 36, 0.22)",
  purple: "#c084fc",
  muted: "#8a8a8a",
  grid: "rgba(255, 255, 255, 0.06)",
  axis: "#8a8a8a",
} as const;

export const PIPELINE_COLORS: Record<string, string> = {
  PENDING: CHART.warning,
  IN_PROGRESS: CHART.primary,
  APPLIED: CHART.purple,
  ACTIVE: CHART.success,
  REJECTED: CHART.danger,
  PAUSED: CHART.muted,
  NOT_AVAILABLE: "#fb923c",
  ON_HOLD: "#fbbf24",
};

export function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMonthLabel(monthKey: string): string {
  const d = new Date(`${monthKey}-01T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function toDailyChartRows(data: { date: string; count: number }[]) {
  return data.map((row) => ({
    date: row.date,
    label: formatShortDate(row.date),
    value: Number(row.count),
  }));
}

export function toRankChartRows(
  rows: { name: string; value: number }[],
  limit = 8
) {
  return rows
    .filter((r) => r.value > 0)
    .slice(0, limit)
    .map((r) => ({
      name: r.name.length > 28 ? `${r.name.slice(0, 26)}…` : r.name,
      fullName: r.name,
      value: r.value,
    }));
}

export function buildDeployActivityChart(
  builds: { status: string; createdAt: string }[]
) {
  const dayMap = new Map<string, { completed: number; failed: number; other: number }>();

  for (const build of builds) {
    const day = build.createdAt.slice(0, 10);
    const bucket = dayMap.get(day) ?? { completed: 0, failed: 0, other: 0 };
    const status = build.status.toLowerCase();
    if (status === "completed" || status === "ok") bucket.completed += 1;
    else if (status === "failed" || status === "error") bucket.failed += 1;
    else bucket.other += 1;
    dayMap.set(day, bucket);
  }

  return [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, counts]) => ({
      date,
      label: formatShortDate(date),
      completed: counts.completed,
      failed: counts.failed,
      other: counts.other,
      total: counts.completed + counts.failed + counts.other,
    }));
}

export function buildDeployStatusDonut(
  builds: { status: string }[]
): { name: string; value: number; color: string }[] {
  let completed = 0;
  let failed = 0;
  let other = 0;

  for (const build of builds) {
    const status = build.status.toLowerCase();
    if (status === "completed" || status === "ok") completed += 1;
    else if (status === "failed" || status === "error") failed += 1;
    else other += 1;
  }

  return [
    { name: "Completed", value: completed, color: CHART.success },
    { name: "Failed", value: failed, color: CHART.danger },
    { name: "Other", value: other, color: CHART.warning },
  ].filter((row) => row.value > 0);
}
