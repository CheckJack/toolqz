import Link from "next/link";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminLoginFields } from "@/components/admin/AdminLoginFields";

export default function AdminLoginPage() {
  return (
    <AdminAuthShell subtitle="Sign in to manage TOOLQZ">
      <AdminLoginFields />

      <div className="mt-5 space-y-3 border-t border-dark-border pt-5">
        <Link
          href="/admin/login/forgot-password"
          className="flex w-full items-center justify-center rounded-xl border border-neon/40 bg-neon/10 py-3 text-sm font-semibold text-neon transition-colors hover:bg-neon/15"
        >
          Reset password via email
        </Link>
        <p className="text-center text-[12px] leading-relaxed text-muted-dim">
          Enter your team email — we&apos;ll send a link to choose a new password.
        </p>
        {/* Plain anchor for clients with stale JS bundles */}
        <p className="text-center text-[12px] text-muted">
          <a href="/admin/login/forgot-password" className="text-neon hover:underline">
            Forgot your password?
          </a>
        </p>
      </div>
    </AdminAuthShell>
  );
}
