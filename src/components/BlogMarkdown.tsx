import type { ReactNode } from "react";
import Link from "next/link";
import { BlogToolCard } from "@/components/blog/BlogToolCard";
import {
  extractToolSlugs,
  parseBlogBlocks,
} from "@/lib/blog-markdown";
import { getWebsiteBySlug } from "@/lib/websites";

function inlineFormat(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-medium text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = linkMatch[2];
        const external = href.startsWith("http");
        parts.push(
          external ? (
            <a
              key={key++}
              href={href}
              className="text-neon underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {linkMatch[1]}
            </a>
          ) : (
            <Link
              key={key++}
              href={href}
              className="text-neon underline-offset-2 hover:underline"
            >
              {linkMatch[1]}
            </Link>
          )
        );
      }
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length ? parts : text;
}

export async function BlogMarkdown({ content }: { content: string }) {
  const blocks = parseBlogBlocks(content);
  const toolSlugs = extractToolSlugs(content);

  const toolEntries = await Promise.all(
    toolSlugs.map(async (slug) => [slug, await getWebsiteBySlug(slug)] as const)
  );
  const tools = Object.fromEntries(toolEntries);

  return (
    <div className="article-body space-y-6 text-[16px] leading-[1.75] text-muted sm:text-[17px]">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "toc":
            return null;

          case "tool": {
            const tool = tools[block.slug];
            return tool ? <BlogToolCard key={i} tool={tool} /> : null;
          }

          case "h2":
            return (
              <h2
                key={i}
                id={block.id}
                className="scroll-mt-24 pt-4 text-[1.5rem] font-semibold tracking-[-0.03em] text-white first:pt-0 sm:text-[1.75rem]"
              >
                {inlineFormat(block.text)}
              </h2>
            );

          case "h3":
            return (
              <h3 key={i} className="text-[1.125rem] font-medium text-white sm:text-[1.25rem]">
                {inlineFormat(block.text)}
              </h3>
            );

          case "h4":
            return (
              <h4 key={i} className="text-base font-medium text-white">
                {inlineFormat(block.text)}
              </h4>
            );

          case "blockquote":
            return (
              <blockquote
                key={i}
                className="rounded-xl border border-neon/20 bg-neon/[0.04] px-5 py-4 text-[15px] leading-relaxed text-white sm:px-6"
              >
                {inlineFormat(block.text)}
              </blockquote>
            );

          case "ul":
            return (
              <ul key={i} className="list-disc space-y-2.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{inlineFormat(item)}</li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-2.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{inlineFormat(item)}</li>
                ))}
              </ol>
            );

          case "p":
            return <p key={i}>{inlineFormat(block.text)}</p>;
        }
      })}
    </div>
  );
}
