"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActiveFiltersBar } from "@/components/ActiveFiltersBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CategoryDisclaimer } from "@/components/tool-detail/CategoryDisclaimer";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { WebsiteGrid } from "@/components/WebsiteGrid";
import { markHomepageVisited } from "@/lib/newsletter";
import {
  getCategoryCounts,
  matchesSearch,
  SortOption,
  sortWebsites,
} from "@/lib/homepage";
import { Category, CategoryInfo, Website } from "@/types";

interface HomePageProps {
  websites: Website[];
  categories: CategoryInfo[];
}

function parseCategory(value: string | null, categories: CategoryInfo[]): Category {
  const valid = categories.map((c) => c.id);
  if (value && valid.includes(value)) {
    return value;
  }
  return "all";
}

function parseSort(value: string | null): SortOption {
  if (value === "rating" || value === "name" || value === "reviewed") {
    return value;
  }
  return "featured";
}

export function HomePage({ websites, categories }: HomePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [sort, setSort] = useState<SortOption>("featured");
  const [initialized, setInitialized] = useState(false);

  const categoryCounts = useMemo(() => getCategoryCounts(websites), [websites]);
  const uniqueCategories = useMemo(
    () => new Set(websites.map((w) => w.category)).size,
    [websites]
  );

  useEffect(() => {
    markHomepageVisited();
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") ?? "");
    setActiveCategory(parseCategory(searchParams.get("category"), categories));
    setSort(parseSort(searchParams.get("sort")));
    setInitialized(true);
  }, [searchParams, categories]);

  const syncUrl = useCallback(
    (q: string, category: Category, sortBy: SortOption) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (category !== "all") params.set("category", category);
      if (sortBy !== "featured") params.set("sort", sortBy);

      const query = params.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (!initialized) return;
    syncUrl(searchQuery, activeCategory, sort);
  }, [searchQuery, activeCategory, sort, initialized, syncUrl]);

  const filteredWebsites = useMemo(() => {
    const query = searchQuery.trim();

    const results = websites.filter((site) => {
      const matchesCategory =
        activeCategory === "all" || site.category === activeCategory;
      const matchesQuery = !query || matchesSearch(site, query);
      return matchesCategory && matchesQuery;
    });

    return sortWebsites(results, sort);
  }, [websites, searchQuery, activeCategory, sort]);

  function handleClearAll() {
    setSearchQuery("");
    setActiveCategory("all");
    setSort("featured");
  }

  return (
    <>
      <Header />
      <div className="relative -mt-[calc(var(--header-height)+env(safe-area-inset-top,0px))]">
        <main>
            <HeroSection
              toolCount={websites.length}
              categoryCount={uniqueCategories}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <section id="discover" className="pt-10 sm:pt-12 page-bottom-padding">
                <ScrollReveal eager delay={240} variant="fade-up">
                  <CategoryFilter
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    counts={categoryCounts}
                  />
                </ScrollReveal>

                {activeCategory === "gambling" && (
                  <ScrollReveal eager delay={300} className="mt-4">
                    <CategoryDisclaimer category="gambling" />
                  </ScrollReveal>
                )}

                <div className="mt-0">
                  <ScrollReveal eager delay={300} variant="fade-in">
                    <ActiveFiltersBar
                      searchQuery={searchQuery}
                      activeCategory={activeCategory}
                      resultCount={filteredWebsites.length}
                      sort={sort}
                      onSortChange={setSort}
                      onClearAll={handleClearAll}
                    />
                  </ScrollReveal>

                  <WebsiteGrid
                    websites={filteredWebsites}
                    searchQuery={searchQuery}
                    trackNewsletterIntent
                  />
                </div>
              </section>
            </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
