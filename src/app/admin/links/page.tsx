import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminLinkPage } from "@/components/admin/AdminLinkPage";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";

export default async function AdminLinksPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading link page...</p>}>
        <AdminLinkPage />
      </Suspense>
    </AdminShell>
  );
}
