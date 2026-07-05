"use client";

import Link from "next/link";
import { markToolNavigationIntent } from "@/lib/newsletter";

interface ToolDetailLinkProps {
  slug: string;
  className?: string;
  trackNewsletterIntent?: boolean;
  "aria-label"?: string;
  children: React.ReactNode;
}

export function ToolDetailLink({
  slug,
  className,
  trackNewsletterIntent = false,
  "aria-label": ariaLabel,
  children,
}: ToolDetailLinkProps) {
  return (
    <Link
      href={`/tools/${slug}`}
      className={className}
      aria-label={ariaLabel}
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
