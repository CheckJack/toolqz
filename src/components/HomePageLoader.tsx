import { HomePage } from "@/components/HomePage";
import { getPublishedTools } from "@/lib/tools";

export async function HomePageLoader() {
  let websites: Awaited<ReturnType<typeof getPublishedTools>> = [];

  try {
    websites = await getPublishedTools();
  } catch (error) {
    console.error("[homepage] Failed to load tools:", error);
  }

  return <HomePage websites={websites} />;
}
