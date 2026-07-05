const RESEARCH_TOOLS = new Set([
  "create_tool",
  "create_tools",
  "update_tool",
  "create_blog_draft",
]);

/** Per-user sliding window for expensive research tools. */
const buckets = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_RESEARCH_PER_HOUR = 30;

export function assertResearchRateLimit(userId: string, toolName: string): void {
  if (!RESEARCH_TOOLS.has(toolName)) return;

  const now = Date.now();
  const key = userId;
  const times = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= MAX_RESEARCH_PER_HOUR) {
    throw new Error(
      "Research limit reached (30 per hour). Wait a bit or run smaller batches."
    );
  }
  times.push(now);
  buckets.set(key, times);
}
