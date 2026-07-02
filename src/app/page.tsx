import { Suspense } from "react";
import { HomePage } from "@/components/HomePage";
import { getPublishedTools } from "@/lib/tools";

export const dynamic = "force-dynamic";

export default async function Page() {
  let websites: Awaited<ReturnType<typeof getPublishedTools>> = [];

  try {
    websites = await getPublishedTools();
  } catch (error) {
    console.error("[homepage] Failed to load tools:", error);
  }

  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading tools...</div>}>
      <HomePage websites={websites} />
    </Suspense>
  );
}
