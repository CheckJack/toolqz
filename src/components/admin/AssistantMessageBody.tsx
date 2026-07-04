"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { AssistantCard } from "@/lib/agent/assistant-cards";

function inlineFormat(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-dark px-1 py-0.5 font-mono text-[0.85em] text-neon"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

function ChatMarkdown({ content }: { content: string }) {
  const lines = content.trim().split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={key++} className="mt-1.5 space-y-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-snug">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/70" />
            <span>{inlineFormat(item)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const line of lines) {
    const bullet = line.match(/^[\s]*[-*•]\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      continue;
    }
    flushList();
    const trimmed = line.trim();
    if (!trimmed) continue;
    blocks.push(
      <p key={key++} className="text-[13px] leading-relaxed">
        {inlineFormat(trimmed)}
      </p>
    );
  }
  flushList();

  return <div className="space-y-1">{blocks}</div>;
}

function StatCard({ card }: { card: Extract<AssistantCard, { type: "stats" }> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-dark-border/80 bg-dark/60">
      {card.title && (
        <p className="border-b border-dark-border/60 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">
          {card.title}
        </p>
      )}
      <div className={`grid gap-px bg-dark-border/40 ${card.items.length > 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {card.items.map((item) => (
          <div key={item.label} className="bg-dark-elevated/80 px-3 py-2.5">
            <p className="text-[10px] text-muted">{item.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankedListCard({ card }: { card: Extract<AssistantCard, { type: "ranked_list" }> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-dark-border/80 bg-dark/60">
      <p className="border-b border-dark-border/60 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        {card.title}
      </p>
      <ul className="divide-y divide-dark-border/50">
        {card.items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-2 px-3 py-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neon/10 text-[10px] font-semibold text-neon">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-white">{item.label}</span>
            {item.value !== undefined && (
              <span className="shrink-0 text-[13px] tabular-nums text-muted">
                {item.value}
                {item.hint ? ` ${item.hint}` : ""}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToolListCard({ card }: { card: Extract<AssistantCard, { type: "tool_list" }> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-dark-border/80 bg-dark/60">
      <div className="flex items-center justify-between border-b border-dark-border/60 px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {card.title ?? "Tools"}
        </p>
        {card.total !== undefined && (
          <span className="text-[10px] text-muted">
            {card.tools.length}
            {card.total > card.tools.length ? ` of ${card.total}` : ""}
          </span>
        )}
      </div>
      <ul className="divide-y divide-dark-border/50">
        {card.tools.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={tool.editUrl}
              className="flex items-center gap-2 px-3 py-2 transition hover:bg-neon/5"
            >
              <span className="min-w-0 flex-1 truncate text-[13px] text-white">{tool.name}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  tool.published
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-dark-border text-muted"
                }`}
              >
                {tool.published ? "Live" : "Draft"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AffiliateListCard({ card }: { card: Extract<AssistantCard, { type: "affiliate_list" }> }) {
  const statusColor: Record<string, string> = {
    ACTIVE: "text-emerald-400",
    IN_PROGRESS: "text-sky-400",
    PENDING: "text-amber-400",
    REJECTED: "text-red-400",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-dark-border/80 bg-dark/60">
      <div className="flex items-center justify-between border-b border-dark-border/60 px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {card.title ?? "Affiliates"}
        </p>
        {card.total !== undefined && (
          <span className="text-[10px] text-muted">
            {card.affiliates.length}
            {card.total > card.affiliates.length ? ` of ${card.total}` : ""}
          </span>
        )}
      </div>
      <ul className="divide-y divide-dark-border/50">
        {card.affiliates.map((a) => (
          <li key={a.editUrl}>
            <Link
              href={a.editUrl}
              className="flex items-center gap-2 px-3 py-2 transition hover:bg-neon/5"
            >
              <span className="min-w-0 flex-1 truncate text-[13px] text-white">
                {a.companyName}
              </span>
              <span
                className={`shrink-0 text-[10px] font-medium ${statusColor[a.status] ?? "text-muted"}`}
              >
                {a.status.replace(/_/g, " ")}
              </span>
              {!a.hasTool && (
                <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">
                  No tool
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlertCard({ card }: { card: Extract<AssistantCard, { type: "alert" }> }) {
  const styles = {
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-100",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-100",
    info: "border-sky-500/30 bg-sky-500/5 text-sky-100",
  }[card.variant];

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${styles}`}>
      {card.title && <p className="text-[13px] font-semibold text-white">{card.title}</p>}
      <p className={`text-[12px] leading-relaxed ${card.title ? "mt-1" : ""}`}>{card.message}</p>
    </div>
  );
}

function AssistantCardView({ card }: { card: AssistantCard }) {
  switch (card.type) {
    case "stats":
      return <StatCard card={card} />;
    case "ranked_list":
      return <RankedListCard card={card} />;
    case "tool_list":
      return <ToolListCard card={card} />;
    case "affiliate_list":
      return <AffiliateListCard card={card} />;
    case "alert":
      return <AlertCard card={card} />;
    default:
      return null;
  }
}

export function AssistantMessageBody({
  content,
  cards,
}: {
  content: string;
  cards?: AssistantCard[];
}) {
  const hasCards = cards && cards.length > 0;

  return (
    <div className="space-y-2.5">
      {content.trim() && (
        <div className={hasCards ? "text-muted" : ""}>
          <ChatMarkdown content={content} />
        </div>
      )}
      {hasCards && (
        <div className="space-y-2">
          {cards.map((card, i) => (
            <AssistantCardView key={`${card.type}-${i}`} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
