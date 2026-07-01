import { redirect } from "next/navigation";

/** Legacy route — slug redirects are managed per tool in the tool editor. */
export default function AdminRedirectsPage() {
  redirect("/admin/tools");
}
