import type { FaqItem, HowItWorksStep, PricingTier } from "@/types";

/** One value per line — highlights, tags, URLs, pros, cons. */
export function linesToText(items: string[]): string {
  return items.map((line) => line.trim()).filter(Boolean).join("\n");
}

export function textToLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** How it works — one step per line: `Title | Description` */
export function howItWorksToText(steps: HowItWorksStep[]): string {
  return steps
    .filter((s) => s.title.trim() || s.description.trim())
    .map((s) => `${s.title.trim()} | ${s.description.trim()}`)
    .join("\n");
}

export function textToHowItWorks(text: string): HowItWorksStep[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [{ step: 1, title: "", description: "" }];
  }

  return lines.map((line, index) => {
    const pipe = line.indexOf("|");
    if (pipe === -1) {
      return { step: index + 1, title: line, description: "" };
    }
    return {
      step: index + 1,
      title: line.slice(0, pipe).trim(),
      description: line.slice(pipe + 1).trim(),
    };
  });
}

/** Pricing — one tier per line: `Label | Price | Note` (note optional). */
export function pricingToText(tiers: PricingTier[]): string {
  return tiers
    .filter((t) => t.label.trim() || t.price.trim() || (t.note ?? "").trim())
    .map((t) => {
      const parts = [t.label.trim(), t.price.trim()];
      const note = (t.note ?? "").trim();
      if (note) parts.push(note);
      return parts.join(" | ");
    })
    .join("\n");
}

export function textToPricing(text: string): PricingTier[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [{ label: "", price: "", note: "" }];
  }

  return lines.map((line) => {
    const parts = line.split("|").map((part) => part.trim());
    return {
      label: parts[0] ?? "",
      price: parts[1] ?? "",
      note: parts[2] ?? "",
    };
  });
}

/** FAQ — question on first line, answer on following lines; blank line between items. */
export function faqToText(items: FaqItem[]): string {
  return items
    .filter((f) => f.question.trim() || f.answer.trim())
    .map((f) => `${f.question.trim()}\n${f.answer.trim()}`)
    .join("\n\n");
}

export function textToFaq(text: string): FaqItem[] {
  const blocks = text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return [{ question: "", answer: "" }];
  }

  return blocks.map((block) => {
    const lines = block.split("\n");
    return {
      question: (lines[0] ?? "").trim(),
      answer: lines.slice(1).join("\n").trim(),
    };
  });
}

export function normalizeReviewDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return trimmed;
}
