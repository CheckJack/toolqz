export type Category =
  | "all"
  | "productivity"
  | "food"
  | "digital"
  | "marketing"
  | "finance"
  | "gambling"
  | "health"
  | "education"
  | "entertainment"
  | "shopping";

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export interface PricingTier {
  label: string;
  price: string;
  note?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Website {
  id: string;
  slug: string;
  name: string;
  description: string;
  overview: string;
  highlights: string[];
  url: string;
  category: Exclude<Category, "all">;
  tags: string[];
  featured?: boolean;
  rating?: number;
  logoUrl: string;
  screenshots: string[];
  whoIsItFor: string;
  notForYouIf?: string;
  howItWorks: HowItWorksStep[];
  pricing: PricingTier[];
  pros: string[];
  cons: string[];
  faq: FaqItem[];
  lastReviewed?: string;
}

export interface CategoryInfo {
  id: Category;
  label: string;
}

export type WebsiteBase = Pick<
  Website,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "overview"
  | "highlights"
  | "url"
  | "category"
  | "tags"
  | "featured"
  | "rating"
>;

export type WebsiteRichContent = Pick<
  Website,
  | "logoUrl"
  | "screenshots"
  | "whoIsItFor"
  | "notForYouIf"
  | "howItWorks"
  | "pricing"
  | "pros"
  | "cons"
  | "faq"
  | "lastReviewed"
>;
