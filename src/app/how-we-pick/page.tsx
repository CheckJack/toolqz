import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HowWePickContent } from "@/components/HowWePickContent";
import { StaticPageShell } from "@/components/StaticPageShell";
import { getPublishedTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "How We Pick Tools — TOOLQZ",
  description:
    "Learn how TOOLQZ reviews and selects life-hack tools — hands-on testing, honest pros and cons, and transparent affiliate disclosure.",
};

export const dynamic = "force-dynamic";

export default async function HowWePickPage() {
  const tools = await getPublishedTools();

  return (
    <>
      <Header />
      <StaticPageShell breadcrumb="How we pick tools" wide>
        <HowWePickContent toolCount={tools.length} />
      </StaticPageShell>
      <Footer />
    </>
  );
}
