"use client";

interface AdminChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminChartCard({
  title,
  description,
  action,
  children,
  className = "",
}: AdminChartCardProps) {
  return (
    <div className={`admin-card admin-card-pad ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="admin-section-title">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-dark-border bg-dark/30 text-sm text-muted">
      {message}
    </div>
  );
}
