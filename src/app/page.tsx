import { Suspense } from "react";
import { HomePage } from "@/components/HomePage";
import { getPublishedCategories } from "@/lib/categories";
import { getPublishedTools } from "@/lib/tools";

export const dynamic = "force-dynamic";

export default async function Page() {
  let websites: Awaited<ReturnType<typeof getPublishedTools>> = [];
  let categories: Awaited<ReturnType<typeof getPublishedCategories>> = [
    { id: "all", label: "All" },
  ];

  try {
    [websites, categories] = await Promise.all([getPublishedTools(), getPublishedCategories()]);
  } catch (error) {
    console.error("[homepage] Failed to load tools:", error);
  }

  return (
    <Suspense fallback={null}>
      <HomePage websites={websites} categories={categories} />
    </Suspense>
  );
}
