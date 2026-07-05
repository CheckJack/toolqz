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
    <div className="auth-shell-root relative flex min-h-screen items-center justify-center bg-dark px-4">
      {/* Fallback layout when Tailwind/CSS chunks fail after a deploy */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
.auth-shell-root{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;padding:1rem;box-sizing:border-box}
.auth-shell-card{width:100%;max-width:28rem;border-radius:1rem;border:1px solid #2a2a2a;background:#141414;padding:2rem;box-sizing:border-box}
.auth-shell-card h1{margin:0;text-align:center;font-size:1.5rem;font-weight:700;color:#fff}
.auth-shell-card .auth-subtitle{margin-top:.5rem;text-align:center;font-size:.875rem;color:#9ca3af}
.auth-recovery a{color:#7dd3fc}
`,
        }}
      />
      <div className="auth-shell-card w-full max-w-md rounded-2xl border border-dark-border bg-dark-elevated p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">
            TOOL<span className="text-neon">QZ</span>
          </h1>
          {title ? (
            <p className="mt-2 text-sm font-medium text-white">{title}</p>
          ) : null}
          <p className={`auth-subtitle text-sm text-muted ${title ? "mt-1" : "mt-2"}`}>
            {subtitle}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

export const adminAuthInputClass =
  "w-full rounded-xl border border-dark-border bg-dark px-4 py-3 text-white placeholder:text-muted/60 focus:border-neon/50 focus:outline-none focus:ring-2 focus:ring-neon/20";
