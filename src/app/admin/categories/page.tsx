import { redirect } from "next/navigation";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <AdminCategories />
    </AdminShell>
  );
}
