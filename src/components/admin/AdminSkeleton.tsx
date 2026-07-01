export function AdminSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-dark-border" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-dark-elevated border border-dark-border" />
        ))}
      </div>
      <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-dark-border/50" />
        ))}
      </div>
    </div>
  );
}
