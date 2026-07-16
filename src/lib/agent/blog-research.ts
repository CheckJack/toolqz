import { generateGeminiJson } from "./gemini";
import { slugifyBlogTitle } from "@/lib/blog-payload";
import { BLOG_EDITORIAL_RULES, TOOLQZ_PRODUCT_CONTEXT } from "./product-knowledge";

export interface CatalogToolRef {
  name: string;
  slug: string;
  category: string;
  listingType?: string;
}

export interface AgentBlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
}

export interface ContentIdea {
  title: string;
  angle: string;
  whyItFitsToolqz: string;
  relatedToolSlugs: string[];
  searchIntent: string;
}

const SYSTEM = `${TOOLQZ_PRODUCT_CONTEXT}

${BLOG_EDITORIAL_RULES}

You write TOOLQZ blog posts for the public site. Return JSON only.
This is always a draft for human review — never assume it is published.
Prefer linking to real catalog tools via [[tool:slug]] on their own line when relevant.`;

function formatCatalog(tools: CatalogToolRef[]): string {
  if (!tools.length) {
    return "No catalog tools provided — do not invent [[tool:...]] embeds. Write generally about tool categories TOOLQZ covers.";
  }
  return tools
    .slice(0, 40)
    .map((t) => `- ${t.name} (slug: ${t.slug}, category: ${t.category}${t.listingType ? `, ${t.listingType}` : ""})`)
    .join("\n");
}

export async function researchBlogDraft(
  topic: string,
  options?: { catalogTools?: CatalogToolRef[]; angle?: string }
): Promise<AgentBlogDraft> {
  const catalog = formatCatalog(options?.catalogTools ?? []);
  const angle = options?.angle?.trim();

  const prompt = `Write a full TOOLQZ blog post draft about: ${topic}
${angle ? `\nEditorial angle: ${angle}` : ""}

Catalog tools you MAY embed with [[tool:slug]] (use only these slugs):
${catalog}

Return JSON with:
- title (compelling, SEO-friendly, under 70 chars, about tools/software — not generic lifestyle)
- slug (url-friendly kebab-case, optional)
- excerpt (140–160 characters — used as listing + meta description; include primary keyword naturally)
- content (full article in markdown, 800–1400 words)
- coverImage (optional https URL or null)

Content requirements:
1. Start with a short hook paragraph, then [[toc]] on its own line if the post has 4+ ## sections.
2. Use ## headings; blank line between every block.
3. Include at least: who this is for, practical guidance, tradeoffs/cautions, and a short conclusion with next steps.
4. Embed 1–4 relevant catalog tools as [[tool:slug]] on their own lines near where you discuss them (only if catalog lists them).
5. Do NOT invent statistics, awards, or "best of" rankings you cannot verify.
6. Stay on TOOLQZ topics (tools, software, productivity, SaaS comparisons) — never drift into unrelated niches.`;

  const raw = await generateGeminiJson<{
    title: string;
    slug?: string;
    excerpt: string;
    content: string;
    coverImage?: string | null;
  }>(prompt, SYSTEM);

  const title = String(raw.title ?? topic).trim();
  if (!title || !raw.excerpt?.trim() || !raw.content?.trim()) {
    throw new Error("Could not generate blog content");
  }

  return {
    title,
    slug: (raw.slug?.trim() || slugifyBlogTitle(title)).toLowerCase(),
    excerpt: raw.excerpt.trim().slice(0, 200),
    content: raw.content.trim(),
    coverImage: raw.coverImage?.trim() || null,
  };
}

export async function researchContentIdeas(
  brief: string,
  options?: { count?: number; catalogTools?: CatalogToolRef[] }
): Promise<ContentIdea[]> {
  const count = Math.min(Math.max(options?.count ?? 5, 3), 10);
  const catalog = formatCatalog(options?.catalogTools ?? []);

  const system = `${TOOLQZ_PRODUCT_CONTEXT}

You are a TOOLQZ content strategist. Propose blog/content ideas only — do NOT write full articles.
Ideas must be relevant to a curated tool directory (software, SaaS, productivity, comparisons, buying guides).
Return JSON only.`;

  const prompt = `The admin asked for content ideas (planning only — titles and angles, NOT full posts):
"${brief}"

Number of ideas: ${count}

Published/catalog tools to prefer tying ideas to:
${catalog}

Return JSON: { "ideas": [ { "title", "angle", "whyItFitsToolqz", "relatedToolSlugs", "searchIntent" } ] }

Rules:
- Each idea must clearly fit TOOLQZ (tools/software readers). Reject lifestyle, fashion, travel, cooking, etc.
- relatedToolSlugs: 0–4 slugs from the catalog list only (empty array if none fit).
- angle: 1–2 sentences on the unique take (not the full article).
- whyItFitsToolqz: how this helps the directory (SEO, affiliates, category coverage, education).
- searchIntent: likely Google query the post would target.
- Do not write article bodies, outlines longer than the angle field, or markdown posts.`;

  const raw = await generateGeminiJson<{ ideas?: ContentIdea[] }>(prompt, system);
  const ideas = Array.isArray(raw.ideas) ? raw.ideas : [];
  if (!ideas.length) {
    throw new Error("Could not generate content ideas");
  }

  const allowed = new Set((options?.catalogTools ?? []).map((t) => t.slug));
  return ideas.slice(0, count).map((idea) => ({
    title: String(idea.title ?? "").trim(),
    angle: String(idea.angle ?? "").trim(),
    whyItFitsToolqz: String(idea.whyItFitsToolqz ?? "").trim(),
    searchIntent: String(idea.searchIntent ?? "").trim(),
    relatedToolSlugs: (Array.isArray(idea.relatedToolSlugs) ? idea.relatedToolSlugs : [])
      .map((s) => String(s).trim())
      .filter((s) => allowed.has(s))
      .slice(0, 4),
  })).filter((i) => i.title && i.angle);
}
