import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { WebsiteCard } from "@/components/WebsiteCard";
import { Website } from "@/types";

export function FeaturedToolsSection({ websites }: { websites: Website[] }) {
  if (websites.length === 0) return null;

  return (
    <section id="featured" className="pt-section">
      <SectionHeader
        title="Editor's picks"
        description="Tools we'd recommend first — fully reviewed with pricing and trade-offs."
        action={
          <Link href="/#discover" className="btn-ghost hidden text-[13px] sm:inline-flex">
            View all
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {websites.map((website, index) => (
          <WebsiteCard key={website.id} website={website} index={index} />
        ))}
      </div>
    </section>
  );
}
