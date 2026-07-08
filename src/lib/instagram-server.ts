import {
  formatInsightDate,
  getMetaTokenHealth,
  metaGraphGet,
  MetaGraphError,
  type SocialRange,
  socialRangeToSinceUntil,
} from "@/lib/meta-graph";
import { socialRangeStartDate } from "@/lib/analytics-ranges";

export type InstagramRange = SocialRange;

export interface InstagramMediaItem {
  id: string;
  caption: string;
  mediaType: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  reach: number | null;
  engagement: number | null;
  thumbnailUrl: string | null;
}

export interface InstagramReport {
  configured: boolean;
  range: InstagramRange;
  username: string | null;
  followersCount: number;
  mediaCount: number;
  profileViews: number | null;
  totalReach: number;
  dailyReach: { date: string; value: number }[];
  media: InstagramMediaItem[];
  warnings: string[];
  tokenHealth: Awaited<ReturnType<typeof getMetaTokenHealth>> | null;
}

export interface InstagramDiagnostics {
  pageAccessToken: boolean;
  instagramAccountId: boolean;
  ready: boolean;
  hint: string | null;
  tokenHealth?: Awaited<ReturnType<typeof getMetaTokenHealth>>;
}

export class InstagramConfigError extends MetaGraphError {
  constructor(message: string) {
    super(message);
    this.name = "InstagramConfigError";
  }
}

function getInstagramAccountId(): string | null {
  const id = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  return id || null;
}

export async function getInstagramDiagnostics(): Promise<InstagramDiagnostics> {
  const pageAccessToken = Boolean(process.env.META_PAGE_ACCESS_TOKEN?.trim());
  const instagramAccountId = Boolean(getInstagramAccountId());
  const tokenHealth = pageAccessToken ? await getMetaTokenHealth() : undefined;

  let hint: string | null = null;
  if (!pageAccessToken && !instagramAccountId) {
    hint =
      "Set META_PAGE_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in Hostinger environment variables.";
  } else if (!pageAccessToken) {
    hint = "Set META_PAGE_ACCESS_TOKEN (Page access token from Graph API Explorer).";
  } else if (!instagramAccountId) {
    hint = "Set INSTAGRAM_BUSINESS_ACCOUNT_ID (Instagram Business Account ID).";
  } else if (tokenHealth && !tokenHealth.valid) {
    hint = tokenHealth.warning;
  }

  return {
    pageAccessToken,
    instagramAccountId,
    ready: pageAccessToken && instagramAccountId,
    hint,
    tokenHealth,
  };
}

interface AccountFields {
  username?: string;
  followers_count?: number;
  media_count?: number;
}

interface MediaNode {
  id: string;
  caption?: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  thumbnail_url?: string;
  media_url?: string;
}

interface MediaResponse {
  data?: MediaNode[];
}

interface InsightValue {
  value?: number;
  end_time?: string;
}

interface InsightNode {
  name?: string;
  values?: InsightValue[];
  total_value?: { value?: number };
}

interface InsightsResponse {
  data?: InsightNode[];
}

interface ProfileViewsResponse {
  data?: { total_value?: { value?: number } }[];
}

async function fetchMediaInsights(
  mediaId: string,
  mediaType: string
): Promise<{ reach: number | null; engagement: number | null }> {
  const metrics =
    mediaType === "REELS" || mediaType === "VIDEO"
      ? "reach,total_interactions"
      : "reach,total_interactions,saved";

  try {
    const res = await metaGraphGet<InsightsResponse>(`${mediaId}/insights`, {
      metric: metrics,
    });
    const reach = res.data?.find((m) => m.name === "reach")?.values?.[0]?.value ?? null;
    const engagement =
      res.data?.find((m) => m.name === "total_interactions")?.values?.[0]?.value ?? null;
    return { reach: reach ?? null, engagement: engagement ?? null };
  } catch {
    return { reach: null, engagement: null };
  }
}

export async function fetchInstagramReport(range: InstagramRange): Promise<InstagramReport> {
  const diagnostics = await getInstagramDiagnostics();
  const warnings: string[] = [];
  if (diagnostics.tokenHealth?.warning) warnings.push(diagnostics.tokenHealth.warning);

  if (!diagnostics.pageAccessToken || !diagnostics.instagramAccountId) {
    return {
      configured: false,
      range,
      username: null,
      followersCount: 0,
      mediaCount: 0,
      profileViews: null,
      totalReach: 0,
      dailyReach: [],
      media: [],
      warnings,
      tokenHealth: diagnostics.tokenHealth ?? null,
    };
  }

  const igId = getInstagramAccountId()!;
  const { since, until } = socialRangeToSinceUntil(range);
  const rangeStart = socialRangeStartDate(range);

  let reachRes: InsightsResponse = { data: [] };
  let profileViewsRes: ProfileViewsResponse = { data: [] };

  try {
    reachRes = await metaGraphGet<InsightsResponse>(`${igId}/insights`, {
      metric: "reach",
      period: "day",
      since: String(since),
      until: String(until),
    });
  } catch (error) {
    warnings.push(
      error instanceof Error ? `Instagram reach: ${error.message}` : "Instagram reach unavailable."
    );
  }

  try {
    profileViewsRes = await metaGraphGet<ProfileViewsResponse>(`${igId}/insights`, {
      metric: "profile_views",
      period: "day",
      metric_type: "total_value",
      since: String(since),
      until: String(until),
    });
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? `Instagram profile views: ${error.message}`
        : "Instagram profile views unavailable."
    );
  }

  const [account, mediaRes] = await Promise.all([
    metaGraphGet<AccountFields>(igId, {
      fields: "username,followers_count,media_count",
    }),
    metaGraphGet<MediaResponse>(`${igId}/media`, {
      fields:
        "id,caption,media_type,permalink,timestamp,like_count,comments_count,thumbnail_url,media_url",
      limit: "25",
    }),
  ]);

  const reachValues = reachRes.data?.[0]?.values ?? [];
  const dailyReach = reachValues.map((v) => ({
    date: formatInsightDate(v.end_time ?? ""),
    value: v.value ?? 0,
  }));
  const totalReach = dailyReach.reduce((sum, d) => sum + d.value, 0);
  const profileViews = profileViewsRes.data?.[0]?.total_value?.value ?? null;

  const filteredMedia = (mediaRes.data ?? []).filter((item) => {
    if (!item.timestamp) return true;
    return new Date(item.timestamp) >= rangeStart;
  });

  const mediaWithInsights = await Promise.all(
    filteredMedia.slice(0, 12).map(async (item) => {
      const insights = await fetchMediaInsights(item.id, item.media_type ?? "IMAGE");
      return {
        id: item.id,
        caption: item.caption ?? "",
        mediaType: item.media_type ?? "UNKNOWN",
        permalink: item.permalink ?? "",
        timestamp: item.timestamp ?? "",
        likeCount: item.like_count ?? 0,
        commentsCount: item.comments_count ?? 0,
        reach: insights.reach,
        engagement: insights.engagement,
        thumbnailUrl: item.thumbnail_url ?? item.media_url ?? null,
      };
    })
  );

  const mediaWithoutInsights = filteredMedia.slice(12).map((item) => ({
    id: item.id,
    caption: item.caption ?? "",
    mediaType: item.media_type ?? "UNKNOWN",
    permalink: item.permalink ?? "",
    timestamp: item.timestamp ?? "",
    likeCount: item.like_count ?? 0,
    commentsCount: item.comments_count ?? 0,
    reach: null,
    engagement: null,
    thumbnailUrl: item.thumbnail_url ?? item.media_url ?? null,
  }));

  return {
    configured: true,
    range,
    username: account.username ?? null,
    followersCount: account.followers_count ?? 0,
    mediaCount: account.media_count ?? filteredMedia.length,
    profileViews,
    totalReach,
    dailyReach,
    media: [...mediaWithInsights, ...mediaWithoutInsights],
    warnings,
    tokenHealth: diagnostics.tokenHealth ?? null,
  };
}
