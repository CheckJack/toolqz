export interface StatItem {
  label: string;
  value: string | number;
}

export interface RankedItem {
  label: string;
  value?: string | number;
  hint?: string;
  href?: string;
}

export interface ToolListItem {
  name: string;
  slug: string;
  category?: string;
  published: boolean;
  listingType?: string;
  editUrl: string;
}

export interface AffiliateListItem {
  companyName: string;
  status: string;
  hasTool: boolean;
  hasPortal?: boolean;
  editUrl: string;
  directoryUrl?: string;
}

export type AssistantCard =
  | { type: "stats"; title?: string; items: StatItem[] }
  | { type: "ranked_list"; title: string; items: RankedItem[] }
  | { type: "tool_list"; title?: string; total?: number; tools: ToolListItem[] }
  | { type: "affiliate_list"; title?: string; total?: number; affiliates: AffiliateListItem[] }
  | { type: "alert"; variant: "warning" | "success" | "info"; title?: string; message: string; confirmPrompt?: { yes: string; no?: string; token?: string } };

export function cardsFromAnalytics(summary: {
  range: string;
  todayClicks: number;
  weekClicks: number;
  monthClicks: number;
  totalClicks: number;
  rangeClicks: number;
  topTools: { name: string; slug: string; clicks: number; editUrl?: string }[];
  topReferrers: { referrer: string; count: number }[];
  zeroClickTools: number;
  toolCount: number;
  programsNoTool: number;
  toolsMissingAffiliate: number;
}): AssistantCard[] {
  const rangeLabel =
    summary.range === "7d"
      ? "7 days"
      : summary.range === "90d"
        ? "90 days"
        : summary.range === "all"
          ? "all time"
          : "30 days";

  const cards: AssistantCard[] = [
    {
      type: "stats",
      title: `Clicks · ${rangeLabel}`,
      items: [
        { label: "Today", value: summary.todayClicks },
        { label: "7 days", value: summary.weekClicks },
        { label: "30 days", value: summary.monthClicks },
        { label: "All time", value: summary.totalClicks },
      ],
    },
  ];

  if (summary.topTools.length > 0) {
    cards.push({
      type: "ranked_list",
      title: "Top tools",
      items: summary.topTools.slice(0, 8).map((t) => ({
        label: t.name,
        value: t.clicks,
        hint: "clicks",
        href: t.editUrl,
      })),
    });
  }

  if (summary.topReferrers.length > 0) {
    cards.push({
      type: "ranked_list",
      title: "Top referrers",
      items: summary.topReferrers.map((r) => ({
        label: formatReferrer(r.referrer),
        value: r.count,
        hint: "clicks",
      })),
    });
  }

  const extras: StatItem[] = [];
  if (summary.zeroClickTools > 0) {
    extras.push({ label: "Zero-click tools", value: summary.zeroClickTools });
  }
  if (summary.toolsMissingAffiliate > 0) {
    extras.push({ label: "Partners missing tracking URL", value: summary.toolsMissingAffiliate });
  }
  if (summary.programsNoTool > 0) {
    extras.push({ label: "Affiliates without tool", value: summary.programsNoTool });
  }
  if (extras.length > 0) {
    cards.push({ type: "stats", title: "Insights", items: extras });
  }

  return cards;
}

export function cardsFromToolList(result: {
  total: number;
  showing: number;
  tools: ToolListItem[];
}): AssistantCard[] {
  if (result.tools.length === 0) {
    return [{ type: "alert", variant: "info", message: "No tools matched that search." }];
  }

  return [
    {
      type: "tool_list",
      title: "Tools",
      total: result.total,
      tools: result.tools,
    },
  ];
}

export function cardsFromAffiliateList(result: {
  total: number;
  showing: number;
  affiliates: AffiliateListItem[];
}): AssistantCard[] {
  if (result.affiliates.length === 0) {
    return [{ type: "alert", variant: "info", message: "No affiliate programs matched." }];
  }

  return [
    {
      type: "affiliate_list",
      title: "Affiliate programs",
      total: result.total,
      affiliates: result.affiliates,
    },
  ];
}

export function cardFromConfirmation(
  preview: Record<string, unknown>,
  confirmationToken?: string
): AssistantCard {
  const action = typeof preview.action === "string" ? preview.action : "action";
  const message =
    typeof preview.message === "string" ? preview.message : "This action needs your confirmation.";
  const tool =
    preview.tool && typeof preview.tool === "object"
      ? (preview.tool as { name?: string })
      : undefined;
  const post =
    preview.post && typeof preview.post === "object"
      ? (preview.post as { title?: string })
      : undefined;
  const toolName = tool?.name ?? post?.title ?? "this item";
  const title =
    action === "delete"
      ? `Delete ${toolName}?`
      : action === "publish"
        ? `Publish ${toolName}?`
        : action === "unpublish"
          ? `Unpublish ${toolName}?`
          : action === "feature"
            ? `Feature ${toolName}?`
            : action === "unfeature"
              ? `Unfeature ${toolName}?`
              : action === "publish_blog"
                ? `Publish ${toolName}?`
                : action === "unpublish_blog"
                  ? `Unpublish ${toolName}?`
                  : "Confirm action";

  return {
    type: "alert",
    variant: "warning",
    title,
    message,
    confirmPrompt: {
      yes: buildConfirmYesMessage(action, toolName),
      no: "Cancel — do not proceed",
      token: confirmationToken,
    },
  };
}

function buildConfirmYesMessage(action: string, name: string): string {
  switch (action) {
    case "delete":
      return `Yes, confirm delete "${name}"`;
    case "publish":
      return `Yes, confirm publish "${name}"`;
    case "unpublish":
      return `Yes, confirm unpublish "${name}"`;
    case "feature":
      return `Yes, confirm feature "${name}"`;
    case "unfeature":
      return `Yes, confirm unfeature "${name}"`;
    case "publish_blog":
      return `Yes, confirm publish blog post "${name}"`;
    case "unpublish_blog":
      return `Yes, confirm unpublish blog post "${name}"`;
    case "delete_task":
      return `Yes, confirm delete task "${name}"`;
    case "delete_playbook_snippet":
      return `Yes, confirm delete playbook snippet "${name}"`;
    default:
      return "Yes, confirm";
  }
}

export function cardsFromMyWork(summary: {
  myAssigned: number;
  myOverdue: number;
  myInProgress: number;
  draftTools: number;
  toolsMissingAffiliate: number;
  programsNoTool: number;
  followUpsDue: number;
  overduePrograms: { companyName: string; status: string; due: string; editUrl: string }[];
  tasks?: {
    assignedToMe: number;
    myTodo: number;
    myInProgress: number;
    myOverdue: number;
    overdueTasks: { title: string; due: string; status: string; section: string; tasksUrl: string }[];
  };
}): AssistantCard[] {
  const cards: AssistantCard[] = [
    {
      type: "stats",
      title: "Your queue",
      items: [
        { label: "Assigned affiliates", value: summary.myAssigned },
        { label: "Overdue CRM follow-ups", value: summary.myOverdue },
        { label: "Affiliates in progress", value: summary.myInProgress },
        ...(summary.tasks
          ? [
              { label: "Tasks assigned to you", value: summary.tasks.assignedToMe },
              { label: "Task to-dos", value: summary.tasks.myTodo },
              { label: "Overdue tasks", value: summary.tasks.myOverdue },
            ]
          : []),
        { label: "Draft tools (all)", value: summary.draftTools },
      ],
    },
    {
      type: "stats",
      title: "Catalog",
      items: [
        { label: "Published partners, no tracking URL", value: summary.toolsMissingAffiliate },
        { label: "Affiliates without tool", value: summary.programsNoTool },
        { label: "Follow-ups due (7d)", value: summary.followUpsDue },
      ],
    },
  ];

  if (summary.overduePrograms.length > 0) {
    cards.push({
      type: "ranked_list",
      title: "Overdue CRM follow-ups",
      items: summary.overduePrograms.map((p) => ({
        label: p.companyName,
        value: p.due,
        hint: p.status,
        href: p.editUrl,
      })),
    });
  }

  if (summary.tasks && summary.tasks.overdueTasks.length > 0) {
    cards.push({
      type: "ranked_list",
      title: "Overdue tasks",
      items: summary.tasks.overdueTasks.map((t) => ({
        label: t.title,
        value: t.due,
        hint: t.section,
        href: t.tasksUrl,
      })),
    });
  }

  return cards;
}

export interface TaskListItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  section: string;
  dueAt: string | null;
  assignee: string | null;
  tasksUrl: string;
}

export function cardsFromTasks(result: {
  total: number;
  showing: number;
  tasks: TaskListItem[];
}): AssistantCard[] {
  if (result.tasks.length === 0) {
    return [{ type: "alert", variant: "info", message: "No tasks matched." }];
  }

  return [
    {
      type: "ranked_list",
      title: `Tasks (${result.showing} of ${result.total})`,
      items: result.tasks.map((t) => ({
        label: t.title,
        value: t.status.replace("_", " "),
        hint: [t.section, t.assignee, t.dueAt ? `due ${t.dueAt}` : null]
          .filter(Boolean)
          .join(" · "),
        href: t.tasksUrl,
      })),
    },
  ];
}

export function cardsFromPlaybook(result: {
  query: string;
  total: number;
  showing: number;
  snippets: {
    question: string;
    answer: string;
    category: string;
    sensitive?: boolean;
    answerHidden?: boolean;
    matchReason?: string | null;
    score?: number | null;
  }[];
}): AssistantCard[] {
  if (result.snippets.length === 0) {
    return [
      {
        type: "alert",
        variant: "info",
        message: result.query
          ? `No playbook snippets matched "${result.query}". Try different words or add aliases on /admin/playbook.`
          : "No playbook snippets yet.",
      },
    ];
  }

  const title = result.query
    ? `Playbook (${result.showing} match${result.showing === 1 ? "" : "es"})`
    : `Playbook (${result.showing} of ${result.total})`;

  return [
    {
      type: "ranked_list",
      title,
      items: result.snippets.map((s) => ({
        label: s.question,
        value: s.category.replace(/_/g, " "),
        hint: [
          s.matchReason,
          s.answerHidden
            ? "Sensitive — reveal in Playbook"
            : s.answer.length > 90
              ? `${s.answer.slice(0, 90)}…`
              : s.answer,
        ]
          .filter(Boolean)
          .join(" · "),
        href: "/admin/playbook",
      })),
    },
  ];
}

export function cardsFromFinanceEntries(result: {
  total: number;
  showing: number;
  entries: { type: string; amount: number; description: string; occurredAt: string }[];
}): AssistantCard[] {
  if (result.entries.length === 0) {
    return [{ type: "alert", variant: "info", message: "No finance entries matched." }];
  }

  const fmt = (n: number) => `€${n.toFixed(2)}`;
  return [
    {
      type: "ranked_list",
      title: `Finance entries (${result.showing} of ${result.total})`,
      items: result.entries.map((e) => ({
        label: e.description,
        value: fmt(e.amount),
        hint: `${e.type} · ${e.occurredAt}`,
      })),
    },
  ];
}

export function cardsFromTeamMembers(result: {
  total: number;
  showing: number;
  members: { name: string; role: string; email: string }[];
}): AssistantCard[] {
  if (result.members.length === 0) {
    return [{ type: "alert", variant: "info", message: "No team members matched." }];
  }

  return [
    {
      type: "ranked_list",
      title: `Team (${result.showing} of ${result.total})`,
      items: result.members.map((m) => ({
        label: m.name,
        value: m.role,
        hint: m.email,
      })),
    },
  ];
}

export function cardsFromToolIssues(summary: {
  draftCount: number;
  publishedNoAffiliate: { total: number; items: { name: string; editUrl: string }[] };
  zeroClickPublished: { total: number; items: { name: string; editUrl: string }[] };
  activeCrmNoUrl: { total: number; items: { name: string; editUrl: string }[] };
}): AssistantCard[] {
  const cards: AssistantCard[] = [
    {
      type: "stats",
      title: "Tool issues",
      items: [
        { label: "Draft tools", value: summary.draftCount },
        { label: "Partners, no tracking URL", value: summary.publishedNoAffiliate.total },
        { label: "Zero-click published", value: summary.zeroClickPublished.total },
        { label: "Active CRM, no URL on tool", value: summary.activeCrmNoUrl.total },
      ],
    },
  ];

  const addList = (title: string, items: { name: string; editUrl: string }[]) => {
    if (items.length === 0) return;
    cards.push({
      type: "ranked_list",
      title,
      items: items.map((t) => ({
        label: t.name,
        hint: "open",
        href: t.editUrl,
      })),
    });
  };

  addList("Missing affiliate URL", summary.publishedNoAffiliate.items);
  addList("Zero clicks", summary.zeroClickPublished.items);
  addList("CRM active, no URL", summary.activeCrmNoUrl.items);

  return cards;
}

export interface BlogListItem {
  title: string;
  slug: string;
  published: boolean;
  editUrl: string;
}

export function cardsFromAffiliateDirectory(result: {
  total: number;
  showing: number;
  programs: AffiliateListItem[];
}): AssistantCard[] {
  if (result.programs.length === 0) {
    return [{ type: "alert", variant: "info", message: "No active directory programs matched." }];
  }

  return [
    {
      type: "affiliate_list",
      title: "Affiliate directory",
      total: result.total,
      affiliates: result.programs,
    },
  ];
}

export function cardsFromBlogList(result: {
  total: number;
  showing: number;
  posts: BlogListItem[];
}): AssistantCard[] {
  if (result.posts.length === 0) {
    return [{ type: "alert", variant: "info", message: "No blog posts matched." }];
  }

  return [
    {
      type: "ranked_list",
      title: `Blog posts (${result.showing} of ${result.total})`,
      items: result.posts.map((p) => ({
        label: p.title,
        value: p.published ? "live" : "draft",
        hint: p.slug,
      })),
    },
  ];
}

export function cardsFromFinance(summary: {
  allTime: { earnings: number; expenses: number; net: number };
  last30Days: { earnings: number; expenses: number; net: number };
}): AssistantCard[] {
  const fmt = (n: number) => `€${n.toFixed(2)}`;
  return [
    {
      type: "stats",
      title: "All time",
      items: [
        { label: "Earnings", value: fmt(summary.allTime.earnings) },
        { label: "Expenses", value: fmt(summary.allTime.expenses) },
        { label: "Net", value: fmt(summary.allTime.net) },
      ],
    },
    {
      type: "stats",
      title: "Last 30 days",
      items: [
        { label: "Earnings", value: fmt(summary.last30Days.earnings) },
        { label: "Expenses", value: fmt(summary.last30Days.expenses) },
        { label: "Net", value: fmt(summary.last30Days.net) },
      ],
    },
  ];
}

export function cardsFromAuditLog(result: {
  total: number;
  showing: number;
  entries: { action: string; entity: string; detail: string; user: string; at: string }[];
}): AssistantCard[] {
  if (result.entries.length === 0) {
    return [{ type: "alert", variant: "info", message: "No audit log entries matched." }];
  }

  return [
    {
      type: "ranked_list",
      title: `Audit log (${result.showing} of ${result.total})`,
      items: result.entries.map((e) => ({
        label: e.detail || `${e.action} ${e.entity}`,
        value: e.at,
        hint: e.user,
      })),
    },
  ];
}

export function cardsFromSubscribers(result: {
  total: number;
  showing: number;
  subscribers: { email: string; name: string; subscribedAt: string }[];
}): AssistantCard[] {
  if (result.subscribers.length === 0) {
    return [{ type: "alert", variant: "info", message: "No subscribers matched." }];
  }

  return [
    {
      type: "ranked_list",
      title: `Subscribers (${result.showing} of ${result.total})`,
      items: result.subscribers.map((s) => ({
        label: s.email,
        value: s.subscribedAt,
        hint: s.name,
      })),
    },
  ];
}

function formatReferrer(referrer: string): string {
  if (referrer === "(direct)") return "Direct / unknown";
  try {
    const url = new URL(referrer);
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname === "/" ? "" : url.pathname;
    return `${host}${path}`;
  } catch {
    return referrer.length > 48 ? `${referrer.slice(0, 45)}…` : referrer;
  }
}
