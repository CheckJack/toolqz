import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAffiliates } from "@/components/admin/AdminAffiliates";
import { getSession } from "@/lib/auth";

export default async function AdminAffiliatesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading CRM...</p>}>
        <AdminAffiliates user={session} />
      </Suspense>
    </AdminShell>
  );
}
