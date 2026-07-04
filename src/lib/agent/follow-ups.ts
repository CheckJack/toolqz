import type { AgentToolName } from "./definitions";
import type { FollowUpPrompt } from "./definitions";

export function buildFollowUpPrompts(
  lastTool: AgentToolName | null,
  toolResult: Record<string, unknown> | null
): FollowUpPrompt[] | undefined {
  if (!lastTool || !toolResult) return undefined;

  if (lastTool === "create_tool" && toolResult.success) {
    const name = String(toolResult.name ?? "tool");
    return [
      { label: "Publish", text: `Publish ${name}` },
      { label: "Open draft", text: `List draft tools` },
      { label: "Another", text: "Create a tool for " },
    ];
  }

  if (lastTool === "create_blog_draft" && toolResult.success) {
    const title = String(toolResult.title ?? "blog post");
    return [
      { label: "Publish blog", text: `Publish blog post "${title}"` },
      { label: "List drafts", text: "List draft blog posts" },
    ];
  }

  if (lastTool === "get_my_work") {
    return [
      { label: "Overdue CRM", text: "List my overdue affiliate follow-ups" },
      { label: "Draft tools", text: "List draft tools" },
      { label: "Issues", text: "Show tool issues" },
    ];
  }

  if (lastTool === "get_tool_issues") {
    return [
      { label: "Missing affiliate", text: "List published tools missing affiliate URL" },
      { label: "Analytics", text: "Show click analytics for the last 30 days" },
    ];
  }

  if (lastTool === "list_affiliates" && (toolResult.total as number) > 0) {
    return [
      { label: "No tool yet", text: "List affiliate programs without a tool" },
      { label: "My work", text: "What's on my work queue?" },
    ];
  }

  if (lastTool === "create_tool_from_affiliate" && toolResult.success) {
    const name = String(toolResult.name ?? "tool");
    return [
      { label: "Open draft", text: `List tools matching ${name}` },
      { label: "Publish", text: `Publish ${name}` },
    ];
  }

  if (lastTool === "create_tools" && toolResult.created) {
    return [{ label: "List drafts", text: "List all draft tools" }];
  }

  return undefined;
}
