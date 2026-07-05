import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Sign in — TOOLQZ Admin",
  robots: { index: false, follow: false },
};

export default function AdminSignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
