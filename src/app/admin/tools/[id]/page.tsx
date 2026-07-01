import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminToolEditor } from "@/components/admin/AdminToolEditor";
import { getSession } from "@/lib/auth";

export default async function AdminToolEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;

  return (
    <AdminShell user={session}>
      <AdminToolEditor id={id} user={session} />
    </AdminShell>
  );
}
