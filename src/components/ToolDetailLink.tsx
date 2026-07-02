"use client";

import Link from "next/link";
import { markToolNavigationIntent } from "@/lib/newsletter";

interface ToolDetailLinkProps {
  slug: string;
  className?: string;
  trackNewsletterIntent?: boolean;
  children: React.ReactNode;
}

export function ToolDetailLink({
  slug,
  className,
  trackNewsletterIntent = false,
  children,
}: ToolDetailLinkProps) {
  return (
    <Link
      href={`/tools/${slug}`}
      className={className}
      onClick={() => {
        if (trackNewsletterIntent) {
          markToolNavigationIntent();
        }
      }}
    >
      {children}
    </Link>
  );
}
