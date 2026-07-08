import {
  formatInsightDate,
  metaGraphGet,
  MetaGraphError,
  type SocialRange,
  socialRangeToSinceUntil,
} from "@/lib/meta-graph";

export type InstagramRange = SocialRange;

export interface InstagramMediaItem {
  id: string;
  caption: string;
  mediaType: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
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
}

export interface InstagramDiagnostics {
  pageAccessToken: boolean;
  instagramAccountId: boolean;
  ready: boolean;
  hint: string | null;
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

export function getInstagramDiagnostics(): InstagramDiagnostics {
  const pageAccessToken = Boolean(process.env.META_PAGE_ACCESS_TOKEN?.trim());
  const instagramAccountId = Boolean(getInstagramAccountId());

  let hint: string | null = null;
  if (!pageAccessToken && !instagramAccountId) {
    hint =
      "Set META_PAGE_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in Hostinger environment variables.";
  } else if (!pageAccessToken) {
    hint = "Set META_PAGE_ACCESS_TOKEN (Page access token from Graph API Explorer).";
  } else if (!instagramAccountId) {
    hint = "Set INSTAGRAM_BUSINESS_ACCOUNT_ID (Instagram Business Account ID).";
  }

  return {
    pageAccessToken,
    instagramAccountId,
    ready: pageAccessToken && instagramAccountId,
    hint,
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
}

interface InsightsResponse {
  data?: InsightNode[];
}

interface ProfileViewsResponse {
  data?: { total_value?: { value?: number } }[];
}

export async function fetchInstagramReport(range: InstagramRange): Promise<InstagramReport> {
  const diagnostics = getInstagramDiagnostics();
  if (!diagnostics.ready) {
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
    };
  }

  const igId = getInstagramAccountId()!;
  const { since, until } = socialRangeToSinceUntil(range);

  const [account, mediaRes, reachRes, profileViewsRes] = await Promise.all([
    metaGraphGet<AccountFields>(igId, {
      fields: "username,followers_count,media_count",
    }),
    metaGraphGet<MediaResponse>(`${igId}/media`, {
      fields:
        "id,caption,media_type,permalink,timestamp,like_count,comments_count,thumbnail_url,media_url",
      limit: "25",
    }),
    metaGraphGet<InsightsResponse>(`${igId}/insights`, {
      metric: "reach",
      period: "day",
      since: String(since),
      until: String(until),
    }).catch(() => ({ data: [] as InsightNode[] })),
    metaGraphGet<ProfileViewsResponse>(`${igId}/insights`, {
      metric: "profile_views",
      period: "day",
      metric_type: "total_value",
      since: String(since),
      until: String(until),
    }).catch(() => ({ data: [] })),
  ]);

  const reachValues = reachRes.data?.[0]?.values ?? [];
  const dailyReach = reachValues.map((v) => ({
    date: formatInsightDate(v.end_time ?? ""),
    value: v.value ?? 0,
  }));
  const totalReach = dailyReach.reduce((sum, d) => sum + d.value, 0);
  const profileViews = profileViewsRes.data?.[0]?.total_value?.value ?? null;

  const media = (mediaRes.data ?? []).map((item) => ({
    id: item.id,
    caption: item.caption ?? "",
    mediaType: item.media_type ?? "UNKNOWN",
    permalink: item.permalink ?? "",
    timestamp: item.timestamp ?? "",
    likeCount: item.like_count ?? 0,
    commentsCount: item.comments_count ?? 0,
    thumbnailUrl: item.thumbnail_url ?? item.media_url ?? null,
  }));

  return {
    configured: true,
    range,
    username: account.username ?? null,
    followersCount: account.followers_count ?? 0,
    mediaCount: account.media_count ?? media.length,
    profileViews,
    totalReach,
    dailyReach,
    media,
  };
}
