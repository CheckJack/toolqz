export function AdminAuthShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-elevated p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">
            TOOL<span className="text-neon">QZ</span>
          </h1>
          {title ? (
            <p className="mt-2 text-sm font-medium text-white">{title}</p>
          ) : null}
          <p className={`text-sm text-muted ${title ? "mt-1" : "mt-2"}`}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export const adminAuthInputClass =
  "w-full rounded-xl border border-dark-border bg-dark px-4 py-3 text-white placeholder:text-muted/60 focus:border-neon/50 focus:outline-none focus:ring-2 focus:ring-neon/20";
