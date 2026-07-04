import { DEFAULT_TOOL_CATEGORY_SLUGS } from "@/lib/default-tool-categories";
import { slugify } from "@/lib/tool-payload";
import type { FaqItem, HowItWorksStep, PricingTier } from "@/types";
import { fetchWebsiteContext } from "./fetch-website";
import { generateGeminiJson } from "./gemini";

export interface AgentToolDraft {
  name: string;
  slug: string;
  description: string;
  overview: string;
  category: string;
  url: string;
  rating: number | null;
  lastReviewed: string;
  highlights: string[];
  tags: string[];
  logoUrl: string | null;
  screenshots: string[];
  whoIsItFor: string;
  notForYouIf: string | null;
  pros: string[];
  cons: string[];
  howItWorks: HowItWorksStep[];
  pricing: PricingTier[];
  faq: FaqItem[];
}

const SYSTEM_INSTRUCTION = `You are TOOLQZ's editorial research assistant. You write accurate, balanced tool listings for a software/product directory.

Rules:
- Use only facts supported by the website research provided. Do not invent features or pricing.
- Write clear English. No hype or marketing fluff.
- affiliateUrl must always be null (omitted).
- published and featured must be false.
- category must be exactly one of: ${DEFAULT_TOOL_CATEGORY_SLUGS.join(", ")}.
- lastReviewed must be today's date in YYYY-MM-DD format (use the date given in the prompt).
- At least 5 highlights, 4 tags, 5 pros, 4 cons, 3-4 howItWorks steps, and 5 FAQ items.
- howItWorks items need step (1-based), title, and description.
- pricing items need label and price; note is optional.
- faq items need question and answer.
- logoUrl and screenshots must be full https URLs when possible (from og:image or obvious product images on the site). Use empty string or [] if unknown.
- slug: lowercase, hyphens, no special characters, max 60 chars.
- rating: number 0-5, one decimal, fair and balanced.

Return ONLY valid JSON matching the schema. No markdown.`;

interface GeminiToolResponse {
  name: string;
  slug: string;
  description: string;
  overview: string;
  category: string;
  url: string;
  rating?: number | null;
  lastReviewed?: string;
  highlights?: string[];
  tags?: string[];
  logoUrl?: string | null;
  screenshots?: string[];
  whoIsItFor?: string;
  notForYouIf?: string | null;
  pros?: string[];
  cons?: string[];
  howItWorks?: HowItWorksStep[];
  pricing?: PricingTier[];
  faq?: FaqItem[];
}

function normalizeDraft(raw: GeminiToolResponse, url: string, fallbackName?: string): AgentToolDraft {
  const name = (raw.name || fallbackName || "Untitled tool").trim();
  const category = DEFAULT_TOOL_CATEGORY_SLUGS.includes(
    raw.category as (typeof DEFAULT_TOOL_CATEGORY_SLUGS)[number]
  )
    ? raw.category
    : "digital";

  const howItWorks = (raw.howItWorks ?? [])
    .filter((s) => s.title?.trim() || s.description?.trim())
    .map((s, i) => ({
      step: i + 1,
      title: String(s.title ?? "").trim(),
      description: String(s.description ?? "").trim(),
    }));

  return {
    name,
    slug: slugify(raw.slug || name),
    description: String(raw.description ?? "").trim(),
    overview: String(raw.overview ?? raw.description ?? "").trim(),
    category,
    url: raw.url?.trim() || url,
    rating:
      raw.rating != null && !Number.isNaN(Number(raw.rating))
        ? Math.min(5, Math.max(0, Number(raw.rating)))
        : null,
    lastReviewed: raw.lastReviewed?.trim() || new Date().toISOString().slice(0, 10),
    highlights: (raw.highlights ?? []).map((h) => String(h).trim()).filter(Boolean),
    tags: (raw.tags ?? []).map((t) => String(t).trim().toLowerCase()).filter(Boolean),
    logoUrl: raw.logoUrl?.trim() || null,
    screenshots: (raw.screenshots ?? []).map((s) => String(s).trim()).filter(Boolean),
    whoIsItFor: String(raw.whoIsItFor ?? "").trim(),
    notForYouIf: raw.notForYouIf?.trim() || null,
    pros: (raw.pros ?? []).map((p) => String(p).trim()).filter(Boolean),
    cons: (raw.cons ?? []).map((c) => String(c).trim()).filter(Boolean),
    howItWorks,
    pricing: (raw.pricing ?? [])
      .filter((p) => p.label?.trim() || p.price?.trim())
      .map((p) => ({
        label: String(p.label ?? "").trim(),
        price: String(p.price ?? "").trim(),
        note: p.note?.trim() || undefined,
      })),
    faq: (raw.faq ?? [])
      .filter((f) => f.question?.trim() || f.answer?.trim())
      .map((f) => ({
        question: String(f.question ?? "").trim(),
        answer: String(f.answer ?? "").trim(),
      })),
  };
}

export async function researchToolDraft(input: {
  name?: string;
  url: string;
}): Promise<{ draft: AgentToolDraft; websiteContext: string }> {
  const websiteContext = await fetchWebsiteContext(input.url);
  const today = new Date().toISOString().slice(0, 10);

  const prompt = `Research this product and return a complete tool listing as JSON.

Today's date: ${today}
Product name hint: ${input.name ?? "(infer from website)"}
Website URL: ${input.url}

--- WEBSITE RESEARCH ---
${websiteContext}
--- END RESEARCH ---

Return JSON with fields:
name, slug, description, overview, category, url, rating, lastReviewed,
highlights (array), tags (array), logoUrl, screenshots (array),
whoIsItFor, notForYouIf, pros (array), cons (array),
howItWorks (array of {step, title, description}),
pricing (array of {label, price, note}),
faq (array of {question, answer})`;

  const raw = await generateGeminiJson<GeminiToolResponse>(prompt, SYSTEM_INSTRUCTION);
  const draft = normalizeDraft(raw, input.url, input.name);

  if (!draft.description) {
    throw new Error("Could not generate a tool description from the website");
  }

  return { draft, websiteContext };
}
