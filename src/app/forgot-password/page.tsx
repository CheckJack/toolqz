import { redirect } from "next/navigation";
import { ADMIN_FORGOT_PASSWORD_PATH } from "@/lib/auth-routes";

export default function LegacyRootForgotPasswordPage() {
  redirect(ADMIN_FORGOT_PASSWORD_PATH);
}
