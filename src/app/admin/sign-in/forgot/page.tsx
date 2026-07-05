import { AdminForgotPasswordForm } from "@/components/admin/AdminForgotPasswordForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminForgotPasswordPage() {
  return <AdminForgotPasswordForm />;
}
