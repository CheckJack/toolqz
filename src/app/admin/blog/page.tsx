import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBlog } from "@/components/admin/AdminBlog";
import { getSession } from "@/lib/auth";

export default async function AdminBlogPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading blog…</p>}>
        <AdminBlog />
      </Suspense>
    </AdminShell>
  );
}
