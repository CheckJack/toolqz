import { Website } from "@/types";
import { WebsiteCard } from "./WebsiteCard";

interface WebsiteGridProps {
  websites: Website[];
  searchQuery: string;
}

export function WebsiteGrid({ websites, searchQuery }: WebsiteGridProps) {
  if (websites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dark-border px-6 py-20 text-center">
        <p className="text-[15px] font-medium text-white">No tools found</p>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
          {searchQuery
            ? `Nothing matches "${searchQuery}". Try a different search or clear your filters.`
            : "No tools in this category yet. Try browsing all tools."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {websites.map((website, index) => (
        <WebsiteCard key={website.id} website={website} index={index} />
      ))}
    </div>
  );
}
