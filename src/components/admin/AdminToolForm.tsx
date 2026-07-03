"use client";

import type { FaqItem, HowItWorksStep, PricingTier } from "@/types";
import type { AdminTool } from "@/lib/tool-payload";
import { DateInput } from "@/components/admin/DateInput";
import { DragHandle, useListDragReorder } from "@/components/admin/DraggableReorder";
import { moveItem } from "@/lib/list-reorder";

export interface ToolFormData {
  slug: string;
  name: string;
  description: string;
  overview: string;
  highlights: string[];
  url: string;
  affiliateUrl: string;
  category: string;
  tags: string[];
  featured: boolean;
  rating: string;
  published: boolean;
  logoUrl: string;
  screenshots: string[];
  whoIsItFor: string;
  notForYouIf: string;
  howItWorks: HowItWorksStep[];
  pricing: PricingTier[];
  pros: string[];
  cons: string[];
  faq: FaqItem[];
  lastReviewed: string;
}

export const SITE_CATEGORIES = [
  "productivity",
  "food",
  "digital",
  "marketing",
  "finance",
  "gambling",
  "health",
  "education",
  "entertainment",
  "shopping",
] as const;

export const emptyToolForm: ToolFormData = {
  slug: "",
  name: "",
  description: "",
  overview: "",
  highlights: [""],
  url: "",
  affiliateUrl: "",
  category: "digital",
  tags: [],
  featured: false,
  rating: "",
  published: false,
  logoUrl: "",
  screenshots: [],
  whoIsItFor: "",
  notForYouIf: "",
  howItWorks: [{ step: 1, title: "", description: "" }],
  pricing: [{ label: "", price: "", note: "" }],
  pros: [""],
  cons: [""],
  faq: [{ question: "", answer: "" }],
  lastReviewed: "",
};

export function toolToForm(tool: AdminTool): ToolFormData {
  return {
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    overview: tool.overview,
    highlights: tool.highlights.length ? tool.highlights : [""],
    url: tool.url,
    affiliateUrl: tool.affiliateUrl ?? "",
    category: tool.category,
    tags: tool.tags,
    featured: tool.featured,
    rating: tool.rating != null ? String(tool.rating) : "",
    published: tool.published,
    logoUrl: tool.logoUrl ?? "",
    screenshots: tool.screenshots,
    whoIsItFor: tool.whoIsItFor,
    notForYouIf: tool.notForYouIf ?? "",
    howItWorks: tool.howItWorks.length
      ? tool.howItWorks
      : [{ step: 1, title: "", description: "" }],
    pricing: tool.pricing.length ? tool.pricing : [{ label: "", price: "", note: "" }],
    pros: tool.pros.length ? tool.pros : [""],
    cons: tool.cons.length ? tool.cons : [""],
    faq: tool.faq.length ? tool.faq : [{ question: "", answer: "" }],
    lastReviewed: tool.lastReviewed ?? "",
  };
}

export function formToToolPayload(form: ToolFormData) {
  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    overview: form.overview.trim() || form.description.trim(),
    highlights: form.highlights.filter(Boolean),
    url: form.url.trim(),
    affiliateUrl: form.affiliateUrl.trim() || null,
    category: form.category,
    tags: form.tags.filter(Boolean),
    featured: form.featured,
    rating: form.rating ? Number(form.rating) : null,
    published: form.published,
    logoUrl: form.logoUrl.trim() || null,
    screenshots: form.screenshots.filter(Boolean),
    whoIsItFor: form.whoIsItFor.trim(),
    notForYouIf: form.notForYouIf.trim() || null,
    howItWorks: form.howItWorks.filter((s) => s.title || s.description),
    pricing: form.pricing.filter((p) => p.label || p.price),
    pros: form.pros.filter(Boolean),
    cons: form.cons.filter(Boolean),
    faq: form.faq.filter((f) => f.question || f.answer),
    lastReviewed: form.lastReviewed || null,
  };
}

const inputClass =
  "w-full rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/50 focus:outline-none";

function StringList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const { getItemProps } = useListDragReorder(items, onChange);

  return (
    <div>
      <label className="mb-2 block text-sm text-muted">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => {
          const drag = getItemProps(i);
          return (
          <div key={i} className={`flex gap-2 ${drag.dragClass}`} draggable={drag.draggable} onDragStart={drag.onDragStart} onDragOver={drag.onDragOver} onDrop={drag.onDrop} onDragEnd={drag.onDragEnd}>
            <DragHandle />
            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => onChange(moveItem(items, i, -1))}
                className="rounded border border-dark-border px-1.5 text-xs text-muted hover:text-white disabled:opacity-30"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === items.length - 1}
                onClick={() => onChange(moveItem(items, i, 1))}
                className="rounded border border-dark-border px-1.5 text-xs text-muted hover:text-white disabled:opacity-30"
                aria-label="Move down"
              >
                ↓
              </button>
            </div>
            <input
              className={`${inputClass} flex-1`}
              value={item}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="shrink-0 rounded-lg border border-dark-border px-2 text-muted hover:text-red-400"
            >
              ×
            </button>
          </div>
          );
        })}
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="text-sm text-neon hover:underline"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

function ReorderControls({
  index,
  length,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number;
  length: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-1">
      <button type="button" disabled={index === 0} onClick={onMoveUp} className="rounded border border-dark-border px-2 text-xs text-muted disabled:opacity-30">↑</button>
      <button type="button" disabled={index === length - 1} onClick={onMoveDown} className="rounded border border-dark-border px-2 text-xs text-muted disabled:opacity-30">↓</button>
      <button type="button" onClick={onRemove} className="rounded border border-dark-border px-2 text-xs text-muted hover:text-red-400">×</button>
    </div>
  );
}

function HowItWorksList({
  steps,
  onChange,
}: {
  steps: HowItWorksStep[];
  onChange: (steps: HowItWorksStep[]) => void;
}) {
  const { getItemProps } = useListDragReorder(steps, (next) =>
    onChange(next.map((s, j) => ({ ...s, step: j + 1 })))
  );

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const drag = getItemProps(i);
        return (
        <div
          key={i}
          className={`rounded-xl border border-dark-border p-3 space-y-2 ${drag.dragClass}`}
          draggable={drag.draggable}
          onDragStart={drag.onDragStart}
          onDragOver={drag.onDragOver}
          onDrop={drag.onDrop}
          onDragEnd={drag.onDragEnd}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DragHandle />
              <span className="text-xs text-muted">Step {i + 1}</span>
            </div>
            <ReorderControls
              index={i}
              length={steps.length}
              onMoveUp={() => onChange(moveItem(steps, i, -1).map((s, j) => ({ ...s, step: j + 1 })))}
              onMoveDown={() => onChange(moveItem(steps, i, 1).map((s, j) => ({ ...s, step: j + 1 })))}
              onRemove={() => onChange(steps.filter((_, j) => j !== i).map((s, j) => ({ ...s, step: j + 1 })))}
            />
          </div>
          <input className={inputClass} placeholder="Step title" value={step.title} onChange={(e) => {
            const next = [...steps];
            next[i] = { ...step, step: i + 1, title: e.target.value };
            onChange(next);
          }} />
          <textarea className={`${inputClass} min-h-16`} placeholder="Description" value={step.description} onChange={(e) => {
            const next = [...steps];
            next[i] = { ...step, description: e.target.value };
            onChange(next);
          }} />
        </div>
        );
      })}
      <button type="button" onClick={() => onChange([...steps, { step: steps.length + 1, title: "", description: "" }])} className="text-sm text-neon hover:underline">+ Add step</button>
    </div>
  );
}

function PricingList({
  tiers,
  onChange,
}: {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
}) {
  const { getItemProps } = useListDragReorder(tiers, onChange);

  return (
    <div className="space-y-3">
      {tiers.map((tier, i) => {
        const drag = getItemProps(i);
        return (
        <div
          key={i}
          className={`rounded-xl border border-dark-border p-3 space-y-2 ${drag.dragClass}`}
          draggable={drag.draggable}
          onDragStart={drag.onDragStart}
          onDragOver={drag.onDragOver}
          onDrop={drag.onDrop}
          onDragEnd={drag.onDragEnd}
        >
          <div className="flex items-center justify-between gap-2">
            <DragHandle />
            <ReorderControls
              index={i}
              length={tiers.length}
              onMoveUp={() => onChange(moveItem(tiers, i, -1))}
              onMoveDown={() => onChange(moveItem(tiers, i, 1))}
              onRemove={() => onChange(tiers.filter((_, j) => j !== i))}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input className={inputClass} placeholder="Label" value={tier.label} onChange={(e) => {
              const next = [...tiers];
              next[i] = { ...tier, label: e.target.value };
              onChange(next);
            }} />
            <input className={inputClass} placeholder="Price" value={tier.price} onChange={(e) => {
              const next = [...tiers];
              next[i] = { ...tier, price: e.target.value };
              onChange(next);
            }} />
            <input className={inputClass} placeholder="Note" value={tier.note ?? ""} onChange={(e) => {
              const next = [...tiers];
              next[i] = { ...tier, note: e.target.value };
              onChange(next);
            }} />
          </div>
        </div>
        );
      })}
      <button type="button" onClick={() => onChange([...tiers, { label: "", price: "", note: "" }])} className="text-sm text-neon hover:underline">+ Add tier</button>
    </div>
  );
}

function FaqList({
  items,
  onChange,
}: {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}) {
  const { getItemProps } = useListDragReorder(items, onChange);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const drag = getItemProps(i);
        return (
        <div
          key={i}
          className={`rounded-xl border border-dark-border p-3 space-y-2 ${drag.dragClass}`}
          draggable={drag.draggable}
          onDragStart={drag.onDragStart}
          onDragOver={drag.onDragOver}
          onDrop={drag.onDrop}
          onDragEnd={drag.onDragEnd}
        >
          <div className="flex items-center justify-between gap-2">
            <DragHandle />
            <ReorderControls
              index={i}
              length={items.length}
              onMoveUp={() => onChange(moveItem(items, i, -1))}
              onMoveDown={() => onChange(moveItem(items, i, 1))}
              onRemove={() => onChange(items.filter((_, j) => j !== i))}
            />
          </div>
          <input className={inputClass} placeholder="Question" value={item.question} onChange={(e) => {
            const next = [...items];
            next[i] = { ...item, question: e.target.value };
            onChange(next);
          }} />
          <textarea className={`${inputClass} min-h-16`} placeholder="Answer" value={item.answer} onChange={(e) => {
            const next = [...items];
            next[i] = { ...item, answer: e.target.value };
            onChange(next);
          }} />
        </div>
        );
      })}
      <button type="button" onClick={() => onChange([...items, { question: "", answer: "" }])} className="text-sm text-neon hover:underline">+ Add FAQ</button>
    </div>
  );
}

interface Props {
  form: ToolFormData;
  onChange: (form: ToolFormData) => void;
  isNew?: boolean;
  isAdmin?: boolean;
  originalSlug?: string;
  linkedAffiliate?: { id: string; status: string; companyName: string } | null;
}

export function AdminToolForm({ form, onChange, isNew, isAdmin = true, originalSlug, linkedAffiliate }: Props) {
  const set = <K extends keyof ToolFormData>(key: K, value: ToolFormData[K]) =>
    onChange({ ...form, [key]: value });

  function setSlug(value: string) {
    if (
      !isNew &&
      originalSlug &&
      form.slug === originalSlug &&
      value !== originalSlug &&
      !window.confirm(
        `Change slug from /${originalSlug} to /${value}? A permanent redirect from the old URL will be created automatically.`
      )
    ) {
      return;
    }
    set("slug", value);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-semibold text-neon">Basics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-muted">Name *</label>
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Slug *</label>
            <input
              className={`${inputClass} ${!isAdmin ? "opacity-70" : ""}`}
              value={form.slug}
              onChange={(e) => setSlug(e.target.value)}
              readOnly={!isAdmin}
              required
            />
            {!isAdmin && (
              <p className="mt-1 text-xs text-muted">Only admins can change the slug</p>
            )}
            {!isNew && originalSlug && form.slug !== originalSlug && (
              <p className="mt-1 text-xs text-amber-400">Slug changed from /{originalSlug}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Category</label>
            <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {SITE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Website URL *</label>
            <input className={inputClass} type="url" value={form.url} onChange={(e) => set("url", e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-muted">Affiliate tracking URL</label>
            {linkedAffiliate?.status === "ACTIVE" ? (
              <>
                <input
                  className={`${inputClass} opacity-70`}
                  type="url"
                  value={form.affiliateUrl}
                  readOnly
                  title="Synced from CRM when program is ACTIVE"
                />
                <p className="mt-1 text-xs text-muted">
                  Managed by CRM ({linkedAffiliate.companyName}).{" "}
                  <a href={`/admin/affiliates/${linkedAffiliate.id}`} className="text-neon hover:underline">
                    Edit in CRM
                  </a>
                </p>
              </>
            ) : (
              <>
                <input
                  className={inputClass}
                  type="url"
                  value={form.affiliateUrl}
                  onChange={(e) => set("affiliateUrl", e.target.value)}
                  placeholder="https://..."
                />
                {linkedAffiliate && (
                  <p className="mt-1 text-xs text-muted">
                    Linked to CRM ({linkedAffiliate.companyName}). Set program to ACTIVE to auto-sync.
                  </p>
                )}
              </>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Rating (0–5)</label>
            <input className={inputClass} type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => set("rating", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Last reviewed</label>
            <DateInput
              className={inputClass}
              value={form.lastReviewed}
              onChange={(value) => set("lastReviewed", value)}
            />
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            <label className={`flex items-center gap-2 text-sm ${!isAdmin ? "opacity-70" : ""}`}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set("published", e.target.checked)}
                disabled={!isAdmin}
              />
              Published on site
            </label>
            <label className={`flex items-center gap-2 text-sm ${!isAdmin ? "opacity-70" : ""}`}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                disabled={!isAdmin}
              />
              Featured
            </label>
            {!isAdmin && (
              <span className="text-xs text-muted">Only admins can publish or feature tools</span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-neon">Content</h3>
        <div>
          <label className="mb-1 block text-sm text-muted">Short description *</label>
          <textarea className={`${inputClass} min-h-20`} value={form.description} onChange={(e) => set("description", e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Overview</label>
          <textarea className={`${inputClass} min-h-28`} value={form.overview} onChange={(e) => set("overview", e.target.value)} />
        </div>
        <StringList label="Highlights" items={form.highlights} onChange={(v) => set("highlights", v)} placeholder="Why we recommend it..." />
        <StringList label="Tags (comma-style, one per line)" items={form.tags.length ? form.tags : [""]} onChange={(v) => set("tags", v)} placeholder="productivity" />
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-neon">Rich content</h3>
        <div>
          <label className="mb-1 block text-sm text-muted">Logo URL</label>
          <input className={inputClass} type="url" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} />
          {form.logoUrl && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.logoUrl}
                alt=""
                className="h-12 w-12 rounded-lg border border-dark-border bg-dark object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="text-xs text-muted">Logo preview</span>
            </div>
          )}
        </div>
        <StringList label="Screenshot URLs" items={form.screenshots.length ? form.screenshots : [""]} onChange={(v) => set("screenshots", v)} placeholder="https://..." />
        {form.screenshots.filter(Boolean).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.screenshots.filter(Boolean).map((url, i) => (
              <div key={`${url}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-20 w-32 rounded-lg border border-dark-border bg-dark object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    (e.target as HTMLImageElement).className = "hidden";
                  }}
                />
              </div>
            ))}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm text-muted">Who is it for?</label>
          <textarea className={`${inputClass} min-h-20`} value={form.whoIsItFor} onChange={(e) => set("whoIsItFor", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Not for you if...</label>
          <textarea className={`${inputClass} min-h-16`} value={form.notForYouIf} onChange={(e) => set("notForYouIf", e.target.value)} />
        </div>
        <StringList label="Pros" items={form.pros} onChange={(v) => set("pros", v)} />
        <StringList label="Cons" items={form.cons} onChange={(v) => set("cons", v)} />

        <div>
          <label className="mb-2 block text-sm text-muted">How it works</label>
          <HowItWorksList steps={form.howItWorks} onChange={(v) => set("howItWorks", v)} />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted">Pricing tiers</label>
          <PricingList tiers={form.pricing} onChange={(v) => set("pricing", v)} />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted">FAQ</label>
          <FaqList items={form.faq} onChange={(v) => set("faq", v)} />
        </div>
      </section>
    </div>
  );
}
