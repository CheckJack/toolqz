import { generateGeminiJson } from "./gemini";
import { slugifyBlogTitle } from "@/lib/blog-payload";

export interface AgentBlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
}

const SYSTEM = `You write TOOLQZ blog posts — helpful, editorial articles about tools and software.
Return JSON only. Content must be markdown with headings (##), short paragraphs, and bullet lists where useful.
Do not invent fake statistics. published must be false in your mindset — this is a draft for human review.`;

export async function researchBlogDraft(topic: string): Promise<AgentBlogDraft> {
  const prompt = `Write a blog post draft for TOOLQZ about: ${topic}

Return JSON with:
- title (compelling, under 80 chars)
- slug (url-friendly, optional — we can derive from title)
- excerpt (1-2 sentences for the listing card)
- content (full article in markdown, 600-1200 words)
- coverImage (optional https URL or null)`;

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
    excerpt: raw.excerpt.trim(),
    content: raw.content.trim(),
    coverImage: raw.coverImage?.trim() || null,
  };
}
