import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

interface StaticPageShellProps {
  breadcrumb?: string;
  children: React.ReactNode;
  wide?: boolean;
  compactTop?: boolean;
}

export function StaticPageShell({
  breadcrumb,
  children,
  wide = false,
  compactTop = false,
}: StaticPageShellProps) {
  return (
    <main
      className={`page-bottom-padding px-5 sm:px-8 ${
        compactTop ? "pt-6 sm:pt-8" : "pt-10 sm:pt-14"
      }`}
    >
      <div className={`mx-auto ${wide ? "max-w-4xl" : "max-w-3xl"}`}>
        {breadcrumb && (
          <nav className="mb-10 text-[13px] text-muted-dim sm:mb-12">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-muted">{breadcrumb}</span>
          </nav>
        )}
        {children}
      </div>
    </main>
  );
}

export function StaticPageHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <ScrollReveal as="header" eager className="mb-14 max-w-2xl sm:mb-16">
      <h1 className="text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.5rem]">
        {title}
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">
        {description}
      </p>
    </ScrollReveal>
  );
}
