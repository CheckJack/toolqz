import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollReveal as="section" className="border-t border-dark-border pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-[1.125rem] font-medium tracking-[-0.02em] text-white sm:text-[1.25rem]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted">{children}</div>
    </ScrollReveal>
  );
}

export function LegalPageIntro({
  title,
  description,
  updated,
}: {
  title: string;
  description: string;
  updated: string;
}) {
  return (
    <ScrollReveal as="header" eager className="mb-12 max-w-2xl sm:mb-14">
      <h1 className="text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.5rem]">
        {title}
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">{description}</p>
      <p className="mt-3 text-[13px] text-muted-dim">Last updated: {updated}</p>
    </ScrollReveal>
  );
}

export function LegalInlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-white underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}
