import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAffiliateDetail } from "@/components/admin/AdminAffiliateDetail";
import { getSession } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AffiliateDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  return (
    <AdminShell user={session}>
      <AdminAffiliateDetail id={id} user={session} />
    </AdminShell>
  );
}
