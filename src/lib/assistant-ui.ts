export const ASSISTANT_QUICK_PROMPTS = [
  { label: "My work", text: "What's on my work queue?" },
  { label: "Analytics", text: "Show click analytics for the last 30 days" },
  { label: "Issues", text: "Show tool issues" },
  { label: "Affiliates", text: "List affiliate programs without a tool" },
  { label: "Finance", text: "Show finance summary" },
] as const;

export const ASSISTANT_CAPABILITIES = [
  {
    title: "Tools & listings",
    description: "Create or refresh tools from URLs, publish, and fix issues.",
  },
  {
    title: "Affiliate CRM",
    description: "Search programs, update status, and link tools to CRM rows.",
  },
  {
    title: "Analytics",
    description: "Summarize clicks, top performers, and traffic trends.",
  },
  {
    title: "Content",
    description: "Draft blog posts and manage categories.",
  },
  {
    title: "Team chat",
    description: "For direct messages, use Audience → Messages.",
  },
] as const;

export const ASSISTANT_SHORTCUTS = [
  { keys: "Enter", action: "Send message" },
  { keys: "Shift + Enter", action: "New line" },
  { keys: "⌘K", action: "Focus composer" },
  { keys: "Esc", action: "Close history" },
] as const;
