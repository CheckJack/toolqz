import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { PartnershipsHero } from "@/components/partnerships/PartnershipsHero";
import { SectionHeader } from "@/components/SectionHeader";
import { StaticPageShell } from "@/components/StaticPageShell";
import { WorkWithUsForm } from "@/components/WorkWithUsForm";
import { getShowcasePartners } from "@/data/partners";
import { getPublishedTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Partnerships — TOOLQZ",
  description:
    "Partner with TOOLQZ to promote your product or service. We review and list tools our audience trusts — get in touch about affiliate and partnership opportunities.",
};

export default async function WorkWithUsPage() {
  const tools = await getPublishedTools();
  const partners = getShowcasePartners(tools);

  return (
    <>
      <Header />
      <PartnershipsHero partners={partners} />
      <StaticPageShell wide compactTop>
        <ScrollReveal as="section" id="get-in-touch" variant="scale-in" className="surface scroll-mt-header rounded-xl p-6 sm:p-8">
          <SectionHeader
            title="Get in touch"
            description="Share a few details about your product and we'll get back to you if it's a good fit."
            className="mb-8"
          />
          <WorkWithUsForm />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mt-10 text-center text-[13px] text-muted">
          Want to understand our standards first?{" "}
          <Link href="/how-we-pick" className="text-white transition-colors hover:text-neon">
            See how we pick tools
          </Link>
        </p>
        </ScrollReveal>
      </StaticPageShell>
      <Footer />
    </>
  );
}
