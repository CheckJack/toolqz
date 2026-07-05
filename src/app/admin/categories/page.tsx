import { redirect } from "next/navigation";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);

  return (
    <AdminShell user={session}>
      <AdminCategories />
    </AdminShell>
  );
}
