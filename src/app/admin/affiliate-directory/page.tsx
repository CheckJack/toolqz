import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminAffiliateDirectory } from "@/components/admin/AdminAffiliateDirectory";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";

export default async function AdminAffiliateDirectoryPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading directory…</p>}>
        <AdminAffiliateDirectory />
      </Suspense>
    </AdminShell>
  );
}
