import { checkRateLimit } from "@/lib/rate-limit";

const RESEARCH_TOOLS = new Set([
  "create_tool",
  "create_tools",
  "update_tool",
  "create_blog_draft",
]);

const WINDOW_MS = 60 * 60 * 1000;
const MAX_RESEARCH_PER_HOUR = 30;

export function assertResearchRateLimit(userId: string, toolName: string): void {
  if (!RESEARCH_TOOLS.has(toolName)) return;

  const result = checkRateLimit(`agent-research:${userId}`, MAX_RESEARCH_PER_HOUR, WINDOW_MS);
  if (!result.ok) {
    throw new Error(
      "Research limit reached (30 per hour). Wait a bit or run smaller batches."
    );
  }
}
