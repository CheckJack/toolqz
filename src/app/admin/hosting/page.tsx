import { redirect } from "next/navigation";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { AdminHosting } from "@/components/admin/AdminHosting";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";

export default async function AdminHostingPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);
  if (session.role !== "ADMIN") redirect("/admin");

  return (
    <AdminShell user={session}>
      <AdminHosting />
    </AdminShell>
  );
}
