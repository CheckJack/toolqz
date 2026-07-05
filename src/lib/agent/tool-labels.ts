import type { AgentToolName } from "./definitions";

const LABELS: Record<AgentToolName, string> = {
  create_tool: "Researching website and creating draft…",
  create_tools: "Creating multiple tool drafts…",
  update_tool: "Refreshing tool from website…",
  list_tools: "Searching tools…",
  set_tool_listing_type: "Updating listing type…",
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
  list_affiliate_directory: "Loading affiliate directory…",
  update_affiliate: "Updating affiliate program…",
  create_tool_from_affiliate: "Creating tool from affiliate…",
  get_analytics: "Loading analytics…",
  get_my_work: "Loading your work queue…",
  get_finance_summary: "Loading finance summary…",
  search_audit_log: "Searching audit log…",
  list_subscribers: "Loading subscribers…",
  list_tasks: "Loading tasks…",
  create_task: "Creating task…",
  update_task: "Updating task…",
  delete_task: "Preparing task delete…",
  create_finance_entry: "Adding finance entry…",
  list_finance_entries: "Loading finance entries…",
  list_team_members: "Loading team…",
};

export function toolProgressLabel(tool: AgentToolName): string {
  return LABELS[tool] ?? `Running ${tool.replace(/_/g, " ")}…`;
}
