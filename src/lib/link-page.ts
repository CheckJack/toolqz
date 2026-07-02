import type { CSSProperties } from "react";
import { prisma } from "@/lib/db";
import type {
  LinkPageBackgroundType,
  LinkPageButtonStyle,
  LinkPageItem,
  LinkPageSettings,
} from "@/types/link-page";

const DEFAULT_PAGE_ID = "default";

export const DEFAULT_LINK_PAGE = {
  title: "TOOLQZ",
  bio: "Curated life-hack tools worth your time.",
  avatarUrl: null as string | null,
  backgroundType: "gradient" as LinkPageBackgroundType,
  backgroundColor: "#272727",
  gradientFrom: "#272727",
  gradientTo: "#4b2559",
  buttonColor: "#6db4e8",
  buttonTextColor: "#18181b",
  buttonStyle: "rounded" as LinkPageButtonStyle,
  showBranding: true,
};

export const DEFAULT_LINKS: Array<Omit<LinkPageItem, "id">> = [
  { title: "Browse tools", url: "/", icon: "🔗", sortOrder: 0, enabled: true },
  { title: "Blog", url: "/blog", icon: "✍️", sortOrder: 1, enabled: true },
  { title: "Partnerships", url: "/work-with-us", icon: "🤝", sortOrder: 2, enabled: true },
];

function mapItem(item: {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  sortOrder: number;
  enabled: boolean;
}): LinkPageItem {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    icon: item.icon,
    sortOrder: item.sortOrder,
    enabled: item.enabled,
  };
}

export function serializeLinkPage(page: {
  id: string;
  title: string;
  bio: string;
  avatarUrl: string | null;
  backgroundType: string;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonStyle: string;
  showBranding: boolean;
  updatedAt: Date;
  links: Array<{
    id: string;
    title: string;
    url: string;
    icon: string | null;
    sortOrder: number;
    enabled: boolean;
  }>;
}): LinkPageSettings {
  return {
    id: page.id,
    title: page.title,
    bio: page.bio,
    avatarUrl: page.avatarUrl,
    backgroundType: page.backgroundType as LinkPageBackgroundType,
    backgroundColor: page.backgroundColor,
    gradientFrom: page.gradientFrom,
    gradientTo: page.gradientTo,
    buttonColor: page.buttonColor,
    buttonTextColor: page.buttonTextColor,
    buttonStyle: page.buttonStyle as LinkPageButtonStyle,
    showBranding: page.showBranding,
    links: page.links.map(mapItem),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export async function getLinkPageWithLinks() {
  return prisma.linkPage.findUnique({
    where: { id: DEFAULT_PAGE_ID },
    include: {
      links: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function ensureLinkPage() {
  const existing = await getLinkPageWithLinks();
  if (existing) return existing;

  return prisma.linkPage.create({
    data: {
      id: DEFAULT_PAGE_ID,
      ...DEFAULT_LINK_PAGE,
      links: {
        create: DEFAULT_LINKS,
      },
    },
    include: {
      links: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getPublicLinkPage(): Promise<LinkPageSettings | null> {
  const page = await getLinkPageWithLinks();
  if (!page) return null;

  return serializeLinkPage({
    ...page,
    links: page.links.filter((link) => link.enabled),
  });
}

export function getButtonRadiusClass(style: LinkPageButtonStyle): string {
  switch (style) {
    case "pill":
      return "rounded-full";
    case "square":
      return "rounded-lg";
    default:
      return "rounded-xl";
  }
}

export function getPageBackgroundStyle(page: Pick<
  LinkPageSettings,
  "backgroundType" | "backgroundColor" | "gradientFrom" | "gradientTo"
>): CSSProperties {
  if (page.backgroundType === "gradient") {
    return {
      background: `linear-gradient(165deg, ${page.gradientFrom} 0%, ${page.gradientTo} 100%)`,
    };
  }
  return { backgroundColor: page.backgroundColor };
}

export function normalizeLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
