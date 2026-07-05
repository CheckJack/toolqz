import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTasks } from "@/components/admin/AdminTasks";
import { getSession } from "@/lib/auth";

export default async function AdminTasksPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading tasks...</p>}>
        <AdminTasks user={session} />
      </Suspense>
    </AdminShell>
  );
}
