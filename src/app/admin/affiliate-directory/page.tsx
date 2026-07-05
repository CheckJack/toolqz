import { Suspense } from "react";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import { AdminAffiliateDirectory } from "@/components/admin/AdminAffiliateDirectory";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";

export default async function AdminAffiliateDirectoryPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading directory…</p>}>
        <AdminAffiliateDirectory />
      </Suspense>
    </AdminShell>
  );
}
