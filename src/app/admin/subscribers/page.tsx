import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSubscribers } from "@/components/admin/AdminSubscribers";
import { getSession } from "@/lib/auth";

export default async function AdminSubscribersPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading mailing list...</p>}>
        <AdminSubscribers />
      </Suspense>
    </AdminShell>
  );
}
