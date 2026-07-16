export const ASSISTANT_CAPABILITIES = [
  {
    title: "Marketing & social",
    description: "Calendars, Reels/TikTok/YouTube demos, newsletter outlines, cross-channel campaigns.",
    prompt:
      "Plan this week's Instagram + TikTok + YouTube partner demo videos and a newsletter — scripts and calendar, don't write full blogs",
  },
  {
    title: "Strategy & ideas",
    description: "Brainstorm content and growth — without writing full posts until you ask.",
    prompt: "Give me 5 TOOLQZ blog ideas for the next month — titles and angles only, don't write the posts",
  },
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
    description: "Add programs, pipeline status, follow-ups, portal and tracking URLs.",
    prompt: "List affiliate programs without a tool",
  },
  {
    title: "Analytics & finance",
    description: "Clicks, top tools, earnings and expenses.",
    prompt: "Show click analytics for the last 30 days",
  },
  {
    title: "Content drafts",
    description: "Write SEO-friendly blog drafts tied to the catalog when you want a full post.",
    prompt: "List draft blog posts",
  },
  {
    title: "Notes",
    description: "Private or shared team notes with rich text, links, and uploads.",
    prompt: "Create a shared note titled Weekly marketing ideas with a short outline",
  },
  {
    title: "Tasks",
    description: "Create, list, and update team tasks on the Tasks board.",
    prompt: "List tasks assigned to me",
  },
  {
    title: "Playbook",
    description: "Search copy-paste answers for affiliate forms, emails, and company info.",
    prompt: "Search playbook for why should you promote us",
  },
] as const;

export const ASSISTANT_SHORTCUTS = [
  { keys: "Enter", action: "Send message" },
  { keys: "Shift + Enter", action: "New line" },
  { keys: "⌘K", action: "Focus composer" },
  { keys: "Esc", action: "Close history" },
] as const;
