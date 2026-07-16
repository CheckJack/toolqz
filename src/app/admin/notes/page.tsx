import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminNotes } from "@/components/admin/AdminNotes";
import { getSession } from "@/lib/auth";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";

export default async function AdminNotesPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading notes…</p>}>
        <AdminNotes user={session} />
      </Suspense>
    </AdminShell>
  );
}
