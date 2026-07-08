import {
  formatInsightDate,
  getMetaTokenHealth,
  metaGraphGet,
  MetaGraphError,
  type SocialRange,
  socialRangeToSinceUntil,
} from "@/lib/meta-graph";
import { socialRangeStartDate } from "@/lib/analytics-ranges";

export type FacebookRange = SocialRange;

export interface FacebookPostItem {
  id: string;
  message: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  shareCount: number;
  thumbnailUrl: string | null;
}

export interface FacebookReport {
  configured: boolean;
  range: FacebookRange;
  pageName: string | null;
  followersCount: number;
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  dailyImpressions: { date: string; value: number }[];
  dailyReach: { date: string; value: number }[];
  dailyEngagement: { date: string; value: number }[];
  posts: FacebookPostItem[];
  warnings: string[];
  tokenHealth: Awaited<ReturnType<typeof getMetaTokenHealth>> | null;
}

export interface FacebookDiagnostics {
  pageAccessToken: boolean;
  facebookPageId: boolean;
  ready: boolean;
  hint: string | null;
  tokenHealth?: Awaited<ReturnType<typeof getMetaTokenHealth>>;
}

export class FacebookConfigError extends MetaGraphError {
  constructor(message: string) {
    super(message);
    this.name = "FacebookConfigError";
  }
}

function getFacebookPageId(): string | null {
  const id = process.env.FACEBOOK_PAGE_ID?.trim();
  return id || null;
}

export async function getFacebookDiagnostics(): Promise<FacebookDiagnostics> {
  const pageAccessToken = Boolean(process.env.META_PAGE_ACCESS_TOKEN?.trim());
  const facebookPageId = Boolean(getFacebookPageId());
  const tokenHealth = pageAccessToken ? await getMetaTokenHealth() : undefined;

  let hint: string | null = null;
  if (!pageAccessToken && !facebookPageId) {
    hint =
      "Set META_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID in Hostinger environment variables.";
  } else if (!pageAccessToken) {
    hint = "Set META_PAGE_ACCESS_TOKEN (Page access token from Graph API Explorer).";
  } else if (!facebookPageId) {
    hint = "Set FACEBOOK_PAGE_ID (Facebook Page ID from Graph API Explorer).";
  } else if (tokenHealth && !tokenHealth.valid) {
    hint = tokenHealth.warning;
  }

  return {
    pageAccessToken,
    facebookPageId,
    ready: pageAccessToken && facebookPageId && (tokenHealth?.valid ?? true),
    hint,
    tokenHealth,
  };
}

interface PageFields {
  name?: string;
  followers_count?: number;
  fan_count?: number;
}

interface InsightValue {
  value?: number;
  end_time?: string;
}

interface InsightNode {
  name?: string;
  values?: InsightValue[];
}

interface InsightsResponse {
  data?: InsightNode[];
}

interface SummaryCount {
  summary?: { total_count?: number };
}

interface PostNode {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
  shares?: { count?: number };
  likes?: SummaryCount;
  comments?: SummaryCount;
}

interface PostsResponse {
  data?: PostNode[];
}

function insightSeries(
  data: InsightNode[] | undefined,
  metricName: string
): { date: string; value: number }[] {
  const node = data?.find((item) => item.name === metricName);
  return (node?.values ?? []).map((v) => ({
    date: formatInsightDate(v.end_time ?? ""),
    value: v.value ?? 0,
  }));
}

function sumSeries(series: { value: number }[]): number {
  return series.reduce((sum, d) => sum + d.value, 0);
}

export async function fetchFacebookReport(range: FacebookRange): Promise<FacebookReport> {
  const diagnostics = await getFacebookDiagnostics();
  const warnings: string[] = [];
  if (diagnostics.tokenHealth?.warning) warnings.push(diagnostics.tokenHealth.warning);

  if (!diagnostics.ready) {
    return {
      configured: false,
      range,
      pageName: null,
      followersCount: 0,
      totalImpressions: 0,
      totalReach: 0,
      totalEngagement: 0,
      dailyImpressions: [],
      dailyReach: [],
      dailyEngagement: [],
      posts: [],
      warnings,
      tokenHealth: diagnostics.tokenHealth ?? null,
    };
  }

  const pageId = getFacebookPageId()!;
  const { since, until } = socialRangeToSinceUntil(range);
  const rangeStart = socialRangeStartDate(range);

  let insightsRes: InsightsResponse = { data: [] };
  let postsRes: PostsResponse = { data: [] };

  try {
    insightsRes = await metaGraphGet<InsightsResponse>(`${pageId}/insights`, {
      metric: "page_impressions,page_impressions_unique,page_post_engagements",
      period: "day",
      since: String(since),
      until: String(until),
    });
  } catch (error) {
    warnings.push(
      error instanceof Error ? `Facebook insights: ${error.message}` : "Facebook insights unavailable."
    );
  }

  try {
    postsRes = await metaGraphGet<PostsResponse>(`${pageId}/posts`, {
      fields:
        "id,message,created_time,permalink_url,full_picture,shares,likes.summary(true),comments.summary(true)",
      limit: "25",
    });
  } catch (error) {
    warnings.push(
      error instanceof Error ? `Facebook posts: ${error.message}` : "Facebook posts unavailable."
    );
  }

  const page = await metaGraphGet<PageFields>(pageId, {
    fields: "name,followers_count,fan_count",
  });

  const dailyImpressions = insightSeries(insightsRes.data, "page_impressions");
  const dailyReach = insightSeries(insightsRes.data, "page_impressions_unique");
  const dailyEngagement = insightSeries(insightsRes.data, "page_post_engagements");

  const posts = (postsRes.data ?? [])
    .filter((item) => {
      if (!item.created_time) return true;
      return new Date(item.created_time) >= rangeStart;
    })
    .map((item) => ({
      id: item.id,
      message: item.message ?? "",
      permalink: item.permalink_url ?? "",
      timestamp: item.created_time ?? "",
      likeCount: item.likes?.summary?.total_count ?? 0,
      commentsCount: item.comments?.summary?.total_count ?? 0,
      shareCount: item.shares?.count ?? 0,
      thumbnailUrl: item.full_picture ?? null,
    }));

  return {
    configured: true,
    range,
    pageName: page.name ?? null,
    followersCount: page.followers_count ?? page.fan_count ?? 0,
    totalImpressions: sumSeries(dailyImpressions),
    totalReach: sumSeries(dailyReach),
    totalEngagement: sumSeries(dailyEngagement),
    dailyImpressions,
    dailyReach,
    dailyEngagement,
    posts,
    warnings,
    tokenHealth: diagnostics.tokenHealth ?? null,
  };
}
