import Link from "next/link";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { ADMIN_FORGOT_PASSWORD_PATH } from "@/lib/auth-routes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Server-rendered — visible even when client JS or CSS chunks fail to load. */
function PasswordRecoveryBlock() {
  return (
    <div className="auth-recovery mt-5 space-y-3 border-t border-dark-border pt-5">
      <a
        href={ADMIN_FORGOT_PASSWORD_PATH}
        className="flex w-full items-center justify-center rounded-xl border border-neon/40 bg-neon/10 py-3 text-sm font-semibold text-neon no-underline"
      >
        Reset password via email
      </a>
      <p className="text-center text-[12px] leading-relaxed text-muted-dim">
        Enter your team email — we&apos;ll send a link to choose a new password.
      </p>
      <p className="text-center text-sm text-muted">
        <a href={ADMIN_FORGOT_PASSWORD_PATH} className="text-neon underline">
          Forgot your password?
        </a>
      </p>
    </div>
  );
}

export default function AdminSignInPage() {
  return (
    <AdminAuthShell subtitle="Sign in to manage TOOLQZ">
      <AdminLoginFields />
      <PasswordRecoveryBlock />
      <p className="mt-4 text-center text-[10px] text-muted-dim/50">sign-in 2026-07-05</p>
    </AdminAuthShell>
  );
}
