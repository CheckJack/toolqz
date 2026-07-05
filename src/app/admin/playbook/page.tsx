import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPlaybook } from "@/components/admin/AdminPlaybook";
import { getSession } from "@/lib/auth";

export default async function AdminPlaybookPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading playbook…</p>}>
        <AdminPlaybook user={session} />
      </Suspense>
    </AdminShell>
  );
}
