"use client";

import { usePathname } from "next/navigation";

export function PublicContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return children;
  }

  return <div className="relative z-10">{children}</div>;
}
