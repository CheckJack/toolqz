interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** When true, omit the h1 — shell header already shows the page title */
  hideTitle?: boolean;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  action,
  hideTitle = false,
  className = "",
}: AdminPageHeaderProps) {
  if (hideTitle && !description && !action) return null;

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        {!hideTitle && (
          <h1 className="text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">{title}</h1>
        )}
        {description && (
          <p className={`text-[14px] leading-relaxed text-muted ${hideTitle ? "" : "mt-1"}`}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
