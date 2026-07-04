export interface StatItem {
  label: string;
  value: string | number;
}

export interface RankedItem {
  label: string;
  value?: string | number;
  hint?: string;
}

export interface ToolListItem {
  name: string;
  slug: string;
  category?: string;
  published: boolean;
  editUrl: string;
}

export interface AffiliateListItem {
  companyName: string;
  status: string;
  hasTool: boolean;
  editUrl: string;
}

export type AssistantCard =
  | { type: "stats"; title?: string; items: StatItem[] }
  | { type: "ranked_list"; title: string; items: RankedItem[] }
  | { type: "tool_list"; title?: string; total?: number; tools: ToolListItem[] }
  | { type: "affiliate_list"; title?: string; total?: number; affiliates: AffiliateListItem[] }
  | { type: "alert"; variant: "warning" | "success" | "info"; title?: string; message: string };

export function cardsFromAnalytics(summary: {
  range: string;
  todayClicks: number;
  weekClicks: number;
  monthClicks: number;
  totalClicks: number;
  rangeClicks: number;
  topTools: { name: string; slug: string; clicks: number }[];
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
    extras.push({ label: "Published, no affiliate URL", value: summary.toolsMissingAffiliate });
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

export function cardFromConfirmation(preview: Record<string, unknown>): AssistantCard {
  const action = typeof preview.action === "string" ? preview.action : "action";
  const message =
    typeof preview.message === "string" ? preview.message : "This action needs your confirmation.";
  const tool =
    preview.tool && typeof preview.tool === "object"
      ? (preview.tool as { name?: string })
      : undefined;
  const toolName = tool?.name ?? "this tool";
  const title =
    action === "delete"
      ? `Delete ${toolName}?`
      : action === "publish"
        ? `Publish ${toolName}?`
        : action === "unpublish"
          ? `Unpublish ${toolName}?`
          : "Confirm action";

  return {
    type: "alert",
    variant: "warning",
    title,
    message,
  };
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
