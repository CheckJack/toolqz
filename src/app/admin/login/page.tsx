import { redirect } from "next/navigation";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";

export default function LegacyAdminLoginPage() {
  redirect(ADMIN_SIGN_IN_PATH);
}
