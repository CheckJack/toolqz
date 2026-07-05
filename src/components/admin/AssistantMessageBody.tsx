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

function RankedListCard({
  card,
  compact = false,
}: {
  card: Extract<AssistantCard, { type: "ranked_list" }>;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-dark-border/80 bg-dark/60">
      <p className="border-b border-dark-border/60 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        {card.title}
      </p>
      <ul className={`divide-y divide-dark-border/50 ${compact ? "max-h-64 overflow-y-auto" : ""}`}>
        {card.items.map((item, i) => {
          const meta = [item.value, item.hint].filter(Boolean).join(" · ");
          const inner = compact ? (
            <>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neon/10 text-[10px] font-semibold text-neon">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-white">{item.label}</p>
                {meta && <p className="mt-0.5 text-[11px] leading-snug text-muted">{meta}</p>}
              </div>
            </>
          ) : (
            <>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neon/10 text-[10px] font-semibold text-neon">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-[13px] text-white">{item.label}</span>
              {item.value !== undefined && (
                <span className="max-w-[48%] shrink truncate text-right text-[12px] tabular-nums text-muted">
                  {item.value}
                  {item.hint ? ` ${item.hint}` : ""}
                </span>
              )}
            </>
          );

          return (
            <li key={`${item.label}-${i}`}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex gap-2 px-3 py-2 transition hover:bg-neon/5 ${
                    compact ? "items-start" : "items-center"
                  }`}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  className={`flex gap-2 px-3 py-2 ${compact ? "items-start" : "items-center"}`}
                >
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ToolListCard({
  card,
  compact = false,
}: {
  card: Extract<AssistantCard, { type: "tool_list" }>;
  compact?: boolean;
}) {
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
      <ul className={`divide-y divide-dark-border/50 ${compact ? "max-h-64 overflow-y-auto" : ""}`}>
        {card.tools.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={tool.editUrl}
              className={`flex gap-2 px-3 py-2 transition hover:bg-neon/5 ${
                compact ? "flex-col items-stretch" : "items-center"
              }`}
            >
              <span className={`text-[13px] text-white ${compact ? "leading-snug" : "min-w-0 flex-1 truncate"}`}>
                {tool.name}
              </span>
              <div className={`flex flex-wrap gap-1.5 ${compact ? "" : "shrink-0"}`}>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    tool.published
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-dark-border text-muted"
                  }`}
                >
                  {tool.published ? "Live" : "Draft"}
                </span>
                {tool.listingType && (
                  <span className="rounded-full bg-dark-border px-2 py-0.5 text-[10px] text-muted">
                    {tool.listingType === "AFFILIATE" ? "Partner" : "Editorial"}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AffiliateListCard({
  card,
  compact = false,
}: {
  card: Extract<AssistantCard, { type: "affiliate_list" }>;
  compact?: boolean;
}) {
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
      <ul className={`divide-y divide-dark-border/50 ${compact ? "max-h-64 overflow-y-auto" : ""}`}>
        {card.affiliates.map((a) => (
          <li key={a.editUrl}>
            <Link
              href={a.editUrl}
              className={`flex gap-2 px-3 py-2 transition hover:bg-neon/5 ${
                compact ? "flex-col items-stretch" : "items-center"
              }`}
            >
              <span className={`text-[13px] text-white ${compact ? "leading-snug" : "min-w-0 flex-1 truncate"}`}>
                {a.companyName}
              </span>
              <div className={`flex flex-wrap gap-1.5 ${compact ? "" : "shrink-0"}`}>
                <span
                  className={`text-[10px] font-medium ${statusColor[a.status] ?? "text-muted"}`}
                >
                  {a.status.replace(/_/g, " ")}
                </span>
                {!a.hasTool && (
                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">
                    No tool
                  </span>
                )}
                {a.hasPortal === false && (
                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">
                    No portal
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlertCard({
  card,
  onPrompt,
  onConfirm,
}: {
  card: Extract<AssistantCard, { type: "alert" }>;
  onPrompt?: (text: string) => void;
  onConfirm?: (token: string) => void;
}) {
  const styles = {
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-100",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-100",
    info: "border-sky-500/30 bg-sky-500/5 text-sky-100",
  }[card.variant];

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${styles}`}>
      {card.title && <p className="text-[13px] font-semibold text-white">{card.title}</p>}
      <p className={`text-[12px] leading-relaxed ${card.title ? "mt-1" : ""}`}>{card.message}</p>
      {card.confirmPrompt && (onConfirm || onPrompt) && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (card.confirmPrompt?.token && onConfirm) {
                onConfirm(card.confirmPrompt.token);
              } else if (onPrompt) {
                onPrompt(card.confirmPrompt!.yes);
              }
            }}
            className="rounded-lg bg-neon px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-neon-dim"
          >
            Confirm
          </button>
          {card.confirmPrompt.no && (
            <button
              type="button"
              onClick={() => onPrompt?.(card.confirmPrompt!.no!)}
              className="rounded-lg border border-dark-border px-3 py-1.5 text-[12px] text-muted hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AssistantCardView({
  card,
  onPrompt,
  onConfirm,
  compact = false,
}: {
  card: AssistantCard;
  onPrompt?: (text: string) => void;
  onConfirm?: (token: string) => void;
  compact?: boolean;
}) {
  switch (card.type) {
    case "stats":
      return <StatCard card={card} />;
    case "ranked_list":
      return <RankedListCard card={card} compact={compact} />;
    case "tool_list":
      return <ToolListCard card={card} compact={compact} />;
    case "affiliate_list":
      return <AffiliateListCard card={card} compact={compact} />;
    case "alert":
      return <AlertCard card={card} onPrompt={onPrompt} onConfirm={onConfirm} />;
    default:
      return null;
  }
}

export function AssistantMessageBody({
  content,
  cards,
  onPrompt,
  onConfirm,
  compact = false,
}: {
  content: string;
  cards?: AssistantCard[];
  onPrompt?: (text: string) => void;
  onConfirm?: (token: string) => void;
  compact?: boolean;
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
            <AssistantCardView
              key={`${card.type}-${i}`}
              card={card}
              onPrompt={onPrompt}
              onConfirm={onConfirm}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
