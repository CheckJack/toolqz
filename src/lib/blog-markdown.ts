export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function contentHasToc(content: string): boolean {
  return content.includes("[[toc]]");
}

export function extractHeadings(content: string): { id: string; title: string }[] {
  return content
    .trim()
    .split(/\n\n+/)
    .filter((block) => block.trim().startsWith("## "))
    .map((block) => {
      const title = block.trim().slice(3).replace(/\*\*/g, "");
      return { id: slugifyHeading(title), title };
    });
}

export function extractToolSlugs(content: string): string[] {
  const matches = content.matchAll(/\[\[tool:([a-z0-9-]+)\]\]/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

export type BlogBlock =
  | { type: "toc" }
  | { type: "tool"; slug: string }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string }
  | { type: "h4"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "p"; text: string };

export function parseBlogBlocks(content: string): BlogBlock[] {
  const blocks: BlogBlock[] = [];

  for (const block of content.trim().split(/\n\n+/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed === "[[toc]]") {
      blocks.push({ type: "toc" });
      continue;
    }

    const toolMatch = trimmed.match(/^\[\[tool:([a-z0-9-]+)\]\]$/);
    if (toolMatch) {
      blocks.push({ type: "tool", slug: toolMatch[1] });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3);
      blocks.push({ type: "h2", text, id: slugifyHeading(text.replace(/\*\*/g, "")) });
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4) });
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      blocks.push({ type: "h4", text: trimmed.slice(5) });
      continue;
    }

    if (trimmed.startsWith("> ")) {
      blocks.push({
        type: "blockquote",
        text: trimmed
          .split("\n")
          .map((line) => line.replace(/^>\s?/, ""))
          .join("\n"),
      });
      continue;
    }

    const lines = trimmed.split("\n");
    if (lines.every((line) => line.startsWith("- "))) {
      blocks.push({ type: "ul", items: lines.map((line) => line.slice(2)) });
      continue;
    }

    if (lines.every((line) => /^\d+\.\s/.test(line))) {
      blocks.push({
        type: "ol",
        items: lines.map((line) => line.replace(/^\d+\.\s/, "")),
      });
      continue;
    }

    blocks.push({ type: "p", text: trimmed });
  }

  return blocks;
}
