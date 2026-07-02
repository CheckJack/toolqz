import { Category, CategoryInfo } from "@/types";

interface CategoryFilterProps {
  categories: CategoryInfo[];
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  counts: Record<Category, number>;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
  counts,
}: CategoryFilterProps) {
  return (
    <div
      id="categories"
      className="scrollbar-hide -mx-5 overflow-x-auto px-5 md:-mx-8 md:px-8 lg:mx-0 lg:px-0"
    >
      <div
        role="tablist"
        aria-label="Filter by category"
        className="flex w-max min-w-full gap-1.5 pb-0.5"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          const count = counts[category.id] ?? 0;
          if (category.id !== "all" && count === 0) return null;

          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(category.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-medium backdrop-blur-xl transition-[background-color,border-color,color,box-shadow] ${
                isActive
                  ? "border-neon/40 bg-neon/18 text-neon shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_4px_16px_rgba(0,0,0,0.12)]"
                  : "border-white/12 bg-white/[0.07] text-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:border-white/22 hover:bg-white/[0.12] hover:text-white"
              }`}
            >
              {category.label}
              {category.id !== "all" && (
                <span
                  className={`tabular-nums ${
                    isActive ? "text-neon/70" : "text-muted-dim"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
