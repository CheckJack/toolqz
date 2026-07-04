import type { AgentToolName } from "./definitions";

const LABELS: Record<AgentToolName, string> = {
  create_tool: "Researching website and creating draft…",
  create_tools: "Creating multiple tool drafts…",
  update_tool: "Refreshing tool from website…",
  list_tools: "Searching tools…",
  get_tool_issues: "Checking catalog issues…",
  feature_tool: "Updating featured status…",
  create_category: "Creating category…",
  list_categories: "Loading categories…",
  create_blog_draft: "Writing blog draft…",
  list_blog_posts: "Loading blog posts…",
  publish_blog: "Updating blog publish status…",
  publish_tool: "Updating publish status…",
  delete_tool: "Preparing delete…",
  list_affiliates: "Searching affiliate CRM…",
  update_affiliate: "Updating affiliate program…",
  create_tool_from_affiliate: "Creating tool from affiliate…",
  get_analytics: "Loading analytics…",
  get_my_work: "Loading your work queue…",
  get_finance_summary: "Loading finance summary…",
  search_audit_log: "Searching audit log…",
  list_subscribers: "Loading subscribers…",
};

export function toolProgressLabel(tool: AgentToolName): string {
  return LABELS[tool] ?? `Running ${tool.replace(/_/g, " ")}…`;
}
