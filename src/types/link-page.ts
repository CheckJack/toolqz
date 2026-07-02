export type LinkPageBackgroundType = "solid" | "gradient";
export type LinkPageButtonStyle = "rounded" | "pill" | "square";

export interface LinkPageItem {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  sortOrder: number;
  enabled: boolean;
}

export interface LinkPageSettings {
  id: string;
  title: string;
  bio: string;
  avatarUrl: string | null;
  backgroundType: LinkPageBackgroundType;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonStyle: LinkPageButtonStyle;
  showBranding: boolean;
  links: LinkPageItem[];
  updatedAt: string;
}

export interface LinkPageUpdatePayload {
  title: string;
  bio: string;
  avatarUrl: string | null;
  backgroundType: LinkPageBackgroundType;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonStyle: LinkPageButtonStyle;
  showBranding: boolean;
  links: Array<{
    id?: string;
    title: string;
    url: string;
    icon?: string | null;
    sortOrder: number;
    enabled: boolean;
  }>;
}
