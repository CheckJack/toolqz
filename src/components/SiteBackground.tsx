"use client";

import { usePathname } from "next/navigation";
import { HeroVideo } from "@/components/HeroVideo";

export function SiteBackground() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <HeroVideo />;
}
