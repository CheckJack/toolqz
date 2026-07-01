import { Category } from "@/types";
import { getActiveCategoryLabel, SortOption } from "@/lib/homepage";

interface ActiveFiltersBarProps {
  searchQuery: string;
  activeCategory: Category;
  resultCount: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClearAll: () => void;
}

const sortLabels: Record<SortOption, string> = {
  featured: "Featured",
  rating: "Top rated",
  name: "A–Z",
  reviewed: "Recent",
};

const sortOptions = Object.keys(sortLabels) as SortOption[];

export function ActiveFiltersBar({
  searchQuery,
  activeCategory,
  resultCount,
  sort,
  onSortChange,
  onClearAll,
}: ActiveFiltersBarProps) {
  const hasFilters = Boolean(searchQuery.trim()) || activeCategory !== "all";

  return (
    <div className="mb-4 mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="text-[13px] text-muted">
          <span className="font-medium tabular-nums text-white">{resultCount}</span>
          {" "}
          {resultCount === 1 ? "tool" : "tools"}
        </p>

        {hasFilters && (
          <>
            {activeCategory !== "all" && (
              <span className="rounded-full border border-neon/30 bg-neon/10 px-2.5 py-1 text-[11px] font-medium text-neon">
                {getActiveCategoryLabel(activeCategory)}
              </span>
            )}
            {searchQuery.trim() && (
              <span className="max-w-[12rem] truncate rounded-full border border-dark-border bg-dark-elevated/60 px-2.5 py-1 text-[11px] text-muted sm:max-w-xs">
                &ldquo;{searchQuery.trim()}&rdquo;
              </span>
            )}
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-neon transition-opacity hover:opacity-80"
            >
              Clear
            </button>
          </>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        <span className="shrink-0 text-[12px] text-muted-dim">Sort</span>
        <div
          role="group"
          aria-label="Sort tools"
          className="scrollbar-hide flex items-center gap-1 overflow-x-auto"
        >
          {sortOptions.map((key, index) => {
            const isActive = sort === key;
            return (
              <span key={key} className="inline-flex shrink-0 items-center">
                {index > 0 && (
                  <span className="mx-1.5 text-[12px] text-muted-dim/35" aria-hidden>
                    ·
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onSortChange(key)}
                  aria-pressed={isActive}
                  className={`relative py-1 text-[12px] transition-colors ${
                    isActive
                      ? "font-medium text-white after:absolute after:inset-x-0 after:-bottom-px after:h-px after:rounded-full after:bg-neon"
                      : "text-muted hover:text-white"
                  }`}
                >
                  {sortLabels[key]}
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
