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
      { label: "Set partner", text: `Set ${name} as AFFILIATE partner` },
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
      { label: "My tasks", text: "List tasks assigned to me" },
      { label: "Overdue tasks", text: "List my overdue tasks" },
      { label: "Overdue CRM", text: "List my overdue affiliate follow-ups" },
      { label: "Issues", text: "Show tool issues" },
    ];
  }

  if (lastTool === "list_tasks") {
    return [
      { label: "Add task", text: "Create a task: " },
      { label: "Overdue", text: "List overdue tasks assigned to me" },
      { label: "My queue", text: "What's on my work queue?" },
    ];
  }

  if (lastTool === "create_task" && toolResult.success) {
    const title = String((toolResult.task as { title?: string })?.title ?? "task");
    return [
      { label: "Mark done", text: `Mark task "${title}" as done` },
      { label: "Add another", text: "Create a task: " },
      { label: "My tasks", text: "List tasks assigned to me" },
    ];
  }

  if (lastTool === "update_task" && toolResult.success) {
    return [
      { label: "List tasks", text: "List tasks assigned to me" },
      { label: "Add task", text: "Create a task: " },
    ];
  }

  if (lastTool === "create_finance_entry" && toolResult.success) {
    return [
      { label: "Summary", text: "Show finance summary" },
      { label: "Recent", text: "List recent finance entries" },
    ];
  }

  if (lastTool === "get_tool_issues") {
    return [
      { label: "Partner gaps", text: "List AFFILIATE tools missing tracking URL" },
      { label: "Directory", text: "List active affiliates missing dashboard links" },
      { label: "Analytics", text: "Show click analytics for the last 30 days" },
    ];
  }

  if (lastTool === "list_affiliates" && (toolResult.total as number) > 0) {
    return [
      { label: "No tool yet", text: "List affiliate programs without a tool" },
      { label: "Directory", text: "Open affiliate directory list" },
      { label: "My work", text: "What's on my work queue?" },
    ];
  }

  if (lastTool === "list_affiliate_directory") {
    return [
      { label: "Missing portal", text: "List active affiliates missing dashboard links" },
      { label: "CRM", text: "List in-progress affiliate programs" },
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

  if (lastTool === "set_tool_listing_type" && toolResult.success) {
    return [{ label: "List partners", text: "List AFFILIATE partner tools" }];
  }

  return undefined;
}
