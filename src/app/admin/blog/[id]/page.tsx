import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBlogEditor } from "@/components/admin/AdminBlogEditor";
import { getSession } from "@/lib/auth";

export default async function AdminBlogEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  return (
    <AdminShell user={session}>
      <AdminBlogEditor id={id} />
    </AdminShell>
  );
}
