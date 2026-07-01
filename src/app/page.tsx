import { Suspense } from "react";
import { HomePage } from "@/components/HomePage";
import { getPublishedTools } from "@/lib/tools";

export default async function Page() {
  const websites = await getPublishedTools();

  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading tools...</div>}>
      <HomePage websites={websites} />
    </Suspense>
  );
}
