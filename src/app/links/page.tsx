import type { Metadata } from "next";
import { LinkPageView } from "@/components/links/LinkPageView";
import { ensureLinkPage, serializeLinkPage } from "@/lib/link-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await ensureLinkPage();
  return {
    title: `${page.title} — Links`,
    description: page.bio || `Links from ${page.title}`,
  };
}

export default async function LinksPage() {
  const page = await ensureLinkPage();

  return (
    <LinkPageView
      page={serializeLinkPage({
        ...page,
        links: page.links.filter((link) => link.enabled),
      })}
    />
  );
}
