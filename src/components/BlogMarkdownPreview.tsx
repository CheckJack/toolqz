"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { parseBlogBlocks } from "@/lib/blog-markdown";

function inlineFormat(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
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
        parts.push(
          <Link key={key++} href={href} className="text-neon underline-offset-2 hover:underline">
            {linkMatch[1]}
          </Link>
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

/** Lightweight client preview — tool cards render as placeholders. */
export function BlogMarkdownPreview({ content }: { content: string }) {
  const blocks = parseBlogBlocks(content);

  return (
    <div className="article-body space-y-6 text-[16px] leading-[1.75] text-muted">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "toc":
            return (
              <p key={i} className="text-[13px] text-muted-dim">
                [Table of contents — visible on live post]
              </p>
            );
          case "tool":
            return (
              <div
                key={i}
                className="rounded-xl border border-dashed border-dark-border bg-dark-surface/60 px-4 py-6 text-center text-[13px] text-muted-dim"
              >
                Tool card: {block.slug}
              </div>
            );
          case "h2":
            return (
              <h2 key={i} className="text-xl font-semibold text-white">
                {inlineFormat(block.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="text-lg font-medium text-white">
                {inlineFormat(block.text)}
              </h3>
            );
          case "blockquote":
            return (
              <blockquote key={i} className="rounded-xl border border-neon/20 bg-neon/[0.04] px-5 py-4 text-white">
                {inlineFormat(block.text)}
              </blockquote>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-2 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{inlineFormat(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-2 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{inlineFormat(item)}</li>
                ))}
              </ol>
            );
          case "p":
            return <p key={i}>{inlineFormat(block.text)}</p>;
          default:
            return null;
        }
      })}
    </div>
  );
}
