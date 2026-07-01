import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTools } from "@/components/admin/AdminTools";
import { getSession } from "@/lib/auth";

export default async function AdminToolsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading tools...</p>}>
        <AdminTools user={session} />
      </Suspense>
    </AdminShell>
  );
}
