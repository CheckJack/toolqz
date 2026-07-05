export const ASSISTANT_CAPABILITIES = [
  {
    title: "Tools & listings",
    description: "Create drafts from URLs, set partner vs editorial, publish with confirmation.",
    prompt: "List draft tools",
  },
  {
    title: "Affiliate directory",
    description: "Active partners, dashboard links, missing portal URLs.",
    prompt: "List active affiliates missing dashboard links",
  },
  {
    title: "Affiliate CRM",
    description: "Pipeline status, follow-ups, portal and tracking URLs.",
    prompt: "List affiliate programs without a tool",
  },
  {
    title: "Analytics & finance",
    description: "Clicks, top tools, earnings and expenses.",
    prompt: "Show click analytics for the last 30 days",
  },
  {
    title: "Content",
    description: "Draft blog posts and manage categories.",
    prompt: "List draft blog posts",
  },
  {
    title: "Tasks",
    description: "Create, list, and update team tasks on the Tasks board.",
    prompt: "List tasks assigned to me",
  },
] as const;

export const ASSISTANT_SHORTCUTS = [
  { keys: "Enter", action: "Send message" },
  { keys: "Shift + Enter", action: "New line" },
  { keys: "⌘K", action: "Focus composer" },
  { keys: "Esc", action: "Close history" },
] as const;
