import { generateGeminiJson } from "./gemini";
import { TOOLQZ_MARKETING_OPS, TOOLQZ_PRODUCT_CONTEXT } from "./product-knowledge";
import type { CatalogToolRef } from "./blog-research";

export type MarketingChannel =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "newsletter"
  | "blog"
  | "cross_channel";

export type MarketingPlanKind =
  | "calendar"
  | "video_scripts"
  | "newsletter"
  | "campaign"
  | "hooks";

export interface MarketingPlanItem {
  title: string;
  channel: string;
  format: string;
  hookOrSubject: string;
  outline: string;
  cta: string;
  relatedToolSlugs: string[];
  assetsNeeded: string;
  notes: string;
}

function formatCatalog(tools: CatalogToolRef[]): string {
  if (!tools.length) {
    return "No catalog tools provided — suggest formats generally and ask which partners/tools to feature.";
  }
  return tools
    .slice(0, 40)
    .map(
      (t) =>
        `- ${t.name} (slug: ${t.slug}, category: ${t.category}${t.listingType ? `, ${t.listingType}` : ""})`
    )
    .join("\n");
}

export async function researchMarketingPlan(input: {
  brief: string;
  kind?: MarketingPlanKind;
  channels?: MarketingChannel[];
  count?: number;
  catalogTools?: CatalogToolRef[];
  analyticsHint?: string;
}): Promise<{ summary: string; items: MarketingPlanItem[] }> {
  const count = Math.min(Math.max(input.count ?? 5, 3), 14);
  const kind = input.kind ?? "campaign";
  const channels =
    input.channels?.length ? input.channels : (["cross_channel"] as MarketingChannel[]);
  const catalog = formatCatalog(input.catalogTools ?? []);
  const analytics = input.analyticsHint?.trim() || "No live analytics snippet provided.";

  const system = `${TOOLQZ_PRODUCT_CONTEXT}

${TOOLQZ_MARKETING_OPS}

You are TOOLQZ's in-house marketing strategist + social/video/newsletter expert.
Return JSON only. Produce actionable plans — not full blog articles and not fake metrics.
Prefer real catalog tool slugs when referencing products.`;

  const prompt = `Create a TOOLQZ marketing plan.

User brief: "${input.brief}"
Plan kind: ${kind}
Channels to cover: ${channels.join(", ")}
Number of items: ${count}

Catalog / partners to prefer featuring:
${catalog}

Analytics / performance context (use if relevant, do not invent numbers beyond this):
${analytics}

Return JSON:
{
  "summary": "2-4 sentences: strategy + why this plan fits TOOLQZ this week/month",
  "items": [
    {
      "title": "short working title",
      "channel": "instagram|tiktok|youtube|newsletter|blog|multi",
      "format": "e.g. Reel 30s, TikTok demo, YT walkthrough, newsletter section, carousel",
      "hookOrSubject": "opening hook OR email subject line",
      "outline": "bullet-style shot list / script beats / email sections / post outline (compact)",
      "cta": "clear call to action (TOOLQZ page, /go, subscribe, etc.)",
      "relatedToolSlugs": ["slug-from-catalog-only"],
      "assetsNeeded": "what to film/capture/write",
      "notes": "disclosure, timing, reuse tip, or A/B idea"
    }
  ]
}

Rules by kind:
- calendar: spread items across a realistic cadence; mix channels; batch-friendly.
- video_scripts: prioritize IG/TikTok/YouTube demo scripts with shot-by-shot outline (still compact).
- newsletter: subject, preview text feel in hookOrSubject, scannable sections in outline.
- campaign: one theme recycled across channels (blog ↔ social ↔ email ↔ video).
- hooks: many short hooks/angles; outline can be one-liners.

Always:
- Stay in tools/software niche.
- relatedToolSlugs only from catalog list (or []).
- No invented follower counts, view counts, or rankings.
- Include affiliate disclosure note when promoting partners.`;

  const raw = await generateGeminiJson<{
    summary?: string;
    items?: MarketingPlanItem[];
  }>(prompt, system);

  const allowed = new Set((input.catalogTools ?? []).map((t) => t.slug));
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .slice(0, count)
    .map((item) => ({
      title: String(item.title ?? "").trim(),
      channel: String(item.channel ?? "multi").trim(),
      format: String(item.format ?? "").trim(),
      hookOrSubject: String(item.hookOrSubject ?? "").trim(),
      outline: String(item.outline ?? "").trim(),
      cta: String(item.cta ?? "").trim(),
      assetsNeeded: String(item.assetsNeeded ?? "").trim(),
      notes: String(item.notes ?? "").trim(),
      relatedToolSlugs: (Array.isArray(item.relatedToolSlugs) ? item.relatedToolSlugs : [])
        .map((s) => String(s).trim())
        .filter((s) => allowed.has(s))
        .slice(0, 4),
    }))
    .filter((i) => i.title && (i.outline || i.hookOrSubject));

  if (!items.length) {
    throw new Error("Could not generate a marketing plan");
  }

  return {
    summary: String(raw.summary ?? "").trim() || "Here's a TOOLQZ-focused plan.",
    items,
  };
}
