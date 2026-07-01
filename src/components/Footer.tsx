import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { FooterWordmark } from "@/components/FooterWordmark";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { SocialLinks } from "@/components/SocialLinks";

interface FooterProps {
  variant?: "default" | "overlay";
}

export function Footer({ variant = "overlay" }: FooterProps) {
  const overVideo = variant === "overlay";

  return (
    <footer
      className={`relative z-10 mt-16 overflow-hidden border-t border-dark-border sm:mt-20 ${
        overVideo ? "border-dark-border/60" : "bg-dark"
      }`}
    >
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-12 pb-20 sm:px-8 sm:py-16 sm:pb-24">
        <ScrollReveal className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <BrandLogo as="span" />
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              A curated directory of life-hack tools — tested in-house and updated when things change.
            </p>
            <SocialLinks className="mt-5" />
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-8 text-[13px] sm:grid-cols-3 lg:gap-x-12">
            <div>
              <p className="mb-3 text-white">Explore</p>
              <ul className="space-y-2 text-muted">
                <li>
                  <Link href="/#discover" className="transition-colors hover:text-white">
                    Browse tools
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="transition-colors hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/how-we-pick" className="transition-colors hover:text-white">
                    How we pick
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-white">Company</p>
              <ul className="space-y-2 text-muted">
                <li>
                  <Link href="/work-with-us" className="transition-colors hover:text-white">
                    Partnerships
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-white">Legal</p>
              <ul className="space-y-2 text-muted">
                <li>
                  <Link href="/terms" className="transition-colors hover:text-white">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="transition-colors hover:text-white">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100} variant="fade-in" className="mt-12 flex flex-col gap-4 border-t border-dark-border pt-8 text-[12px] text-muted-dim lg:flex-row lg:items-center lg:justify-between">
          <p>&copy; {new Date().getFullYear()} TOOLQZ</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/terms" className="transition-colors hover:text-muted">
              Terms
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-muted">
              Cookies
            </Link>
          </div>
        </ScrollReveal>
      </div>

      <FooterWordmark />
    </footer>
  );
}
