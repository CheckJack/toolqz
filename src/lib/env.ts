export function getDeploymentIssues(): string[] {
  const issues: string[] = [];

  if (!process.env.DATABASE_URL) {
    issues.push("DATABASE_URL is not set");
  } else if (
    process.env.NODE_ENV === "production" &&
    process.env.DATABASE_URL.startsWith("file:")
  ) {
    issues.push("DATABASE_URL points to SQLite — use PostgreSQL in production");
  }

  if (!process.env.AUTH_SECRET) {
    issues.push("AUTH_SECRET is not set");
  } else if (process.env.AUTH_SECRET.length < 32) {
    issues.push("AUTH_SECRET should be at least 32 characters");
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    issues.push("NEXT_PUBLIC_APP_URL is not set");
  }

  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET) {
    issues.push("CRON_SECRET is not set (optional — only needed for follow-up email cron)");
  }

  return issues;
}
