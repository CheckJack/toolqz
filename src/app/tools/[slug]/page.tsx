import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ToolDetailPage } from "@/components/ToolDetailPage";
import {
  getAllSlugs,
  getRelatedWebsites,
  getWebsiteBySlug,
  resolvePublishedToolSlug,
} from "@/lib/websites";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const website = await getWebsiteBySlug(slug);

  if (!website) {
    return { title: "Tool not found — TOOLQZ" };
  }

  return {
    title: `${website.name} Review & Pricing — TOOLQZ`,
    description: `${website.description} ${website.whoIsItFor}`.slice(0, 160),
    openGraph: {
      title: `${website.name} — TOOLQZ Review`,
      description: website.description,
      type: "website",
      images: website.screenshots[0] ? [{ url: website.screenshots[0] }] : undefined,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const resolved = await resolvePublishedToolSlug(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.redirectedFrom) {
    permanentRedirect(`/tools/${resolved.canonicalSlug}`);
  }

  const website = await getWebsiteBySlug(slug);
  if (!website) {
    notFound();
  }

  const related = await getRelatedWebsites(website);

  return <ToolDetailPage website={website} related={related} />;
}
