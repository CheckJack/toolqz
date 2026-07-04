"use client";

import { useEffect, useState } from "react";
import type { FaqItem, HowItWorksStep, PricingTier } from "@/types";
import type { AdminTool } from "@/lib/tool-payload";
import { DEFAULT_TOOL_CATEGORIES } from "@/lib/default-tool-categories";
import {
  faqToText,
  howItWorksToText,
  linesToText,
  normalizeReviewDate,
  pricingToText,
  textToFaq,
  textToHowItWorks,
  textToLines,
  textToPricing,
} from "@/lib/tool-form-text";

export const SITE_CATEGORIES = DEFAULT_TOOL_CATEGORIES.map((c) => c.slug);

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

export const emptyToolForm: ToolFormData = {
  slug: "",
  name: "",
  description: "",
  overview: "",
  highlights: [],
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
  howItWorks: [],
  pricing: [],
  pros: [],
  cons: [],
  faq: [],
  lastReviewed: "",
};

export function toolToForm(tool: AdminTool): ToolFormData {
  return {
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    overview: tool.overview,
    highlights: tool.highlights,
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
    howItWorks: tool.howItWorks,
    pricing: tool.pricing,
    pros: tool.pros,
    cons: tool.cons,
    faq: tool.faq,
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
    lastReviewed: normalizeReviewDate(form.lastReviewed) || null,
  };
}

const inputClass =
  "w-full rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/50 focus:outline-none";

function LinesField({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  id: string;
  label: string;
  hint: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-muted">
        {label}
      </label>
      <p className="mb-2 text-xs text-muted/80">{hint}</p>
      <textarea
        id={id}
        name={id}
        data-agent-field={id}
        rows={rows}
        className={`${inputClass} min-h-[5rem] font-mono text-[13px] leading-relaxed`}
        value={linesToText(value)}
        placeholder={placeholder}
        onChange={(e) => onChange(textToLines(e.target.value))}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}

function StructuredField({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-muted">
        {label}
      </label>
      <p className="mb-2 text-xs text-muted/80">{hint}</p>
      <textarea
        id={id}
        name={id}
        data-agent-field={id}
        rows={rows}
        className={`${inputClass} min-h-[6rem] font-mono text-[13px] leading-relaxed`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
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
  const [categoryOptions, setCategoryOptions] = useState<{ slug: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        setCategoryOptions(
          (data.items ?? []).map((item: { slug: string; label: string }) => ({
            slug: item.slug,
            label: item.label,
          }))
        );
      })
      .catch(() => {});
  }, []);

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
    <div className="space-y-8" data-agent-form="tool">
      <div className="rounded-xl border border-neon/20 bg-neon/5 px-4 py-3 text-xs text-muted">
        <p className="font-medium text-white">Bulk-friendly fields</p>
        <p className="mt-1">
          List fields use one item per line. Steps: <code className="text-neon">Title | Description</code>.
          Pricing: <code className="text-neon">Label | Price | Note</code>. FAQ: question on the first line,
          answer below, blank line between items. Dates: <code className="text-neon">YYYY-MM-DD</code>.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="font-semibold text-neon">Basics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="tool-name" className="mb-1 block text-sm text-muted">
              Name *
            </label>
            <input
              id="tool-name"
              name="name"
              data-agent-field="name"
              className={inputClass}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="tool-slug" className="mb-1 block text-sm text-muted">
              Slug *
            </label>
            <input
              id="tool-slug"
              name="slug"
              data-agent-field="slug"
              className={`${inputClass} ${!isAdmin ? "opacity-70" : ""}`}
              value={form.slug}
              onChange={(e) => setSlug(e.target.value)}
              readOnly={!isAdmin}
              required
            />
            {!isAdmin && <p className="mt-1 text-xs text-muted">Only admins can change the slug</p>}
            {!isNew && originalSlug && form.slug !== originalSlug && (
              <p className="mt-1 text-xs text-amber-400">Slug changed from /{originalSlug}</p>
            )}
          </div>
          <div>
            <label htmlFor="tool-category" className="mb-1 block text-sm text-muted">
              Category
            </label>
            <select
              id="tool-category"
              name="category"
              data-agent-field="category"
              className={inputClass}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {categoryOptions.length === 0
                ? DEFAULT_TOOL_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))
                : categoryOptions.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
            </select>
            <p className="mt-1 text-xs text-muted">
              Manage categories in{" "}
              <a href="/admin/categories" className="text-neon hover:underline">
                Admin → Categories
              </a>
            </p>
          </div>
          <div>
            <label htmlFor="tool-url" className="mb-1 block text-sm text-muted">
              Website URL *
            </label>
            <input
              id="tool-url"
              name="url"
              data-agent-field="url"
              className={inputClass}
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tool-affiliate-url" className="mb-1 block text-sm text-muted">
              Affiliate tracking URL
            </label>
            {linkedAffiliate?.status === "ACTIVE" ? (
              <>
                <input
                  id="tool-affiliate-url"
                  name="affiliateUrl"
                  data-agent-field="affiliateUrl"
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
                  id="tool-affiliate-url"
                  name="affiliateUrl"
                  data-agent-field="affiliateUrl"
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
            <label htmlFor="tool-rating" className="mb-1 block text-sm text-muted">
              Rating (0–5)
            </label>
            <input
              id="tool-rating"
              name="rating"
              data-agent-field="rating"
              className={inputClass}
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={form.rating}
              onChange={(e) => set("rating", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="tool-last-reviewed" className="mb-1 block text-sm text-muted">
              Last reviewed
            </label>
            <p className="mb-2 text-xs text-muted/80">Plain text date, e.g. 2026-07-04</p>
            <input
              id="tool-last-reviewed"
              name="lastReviewed"
              data-agent-field="lastReviewed"
              className={inputClass}
              type="text"
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              pattern="\d{4}-\d{2}-\d{2}"
              value={form.lastReviewed}
              onChange={(e) => set("lastReviewed", e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            <label className={`flex items-center gap-2 text-sm ${!isAdmin ? "opacity-70" : ""}`}>
              <input
                id="tool-published"
                name="published"
                data-agent-field="published"
                type="checkbox"
                checked={form.published}
                onChange={(e) => set("published", e.target.checked)}
                disabled={!isAdmin}
              />
              Published on site
            </label>
            <label className={`flex items-center gap-2 text-sm ${!isAdmin ? "opacity-70" : ""}`}>
              <input
                id="tool-featured"
                name="featured"
                data-agent-field="featured"
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
          <label htmlFor="tool-description" className="mb-1 block text-sm text-muted">
            Short description *
          </label>
          <textarea
            id="tool-description"
            name="description"
            data-agent-field="description"
            className={`${inputClass} min-h-20`}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="tool-overview" className="mb-1 block text-sm text-muted">
            Overview
          </label>
          <textarea
            id="tool-overview"
            name="overview"
            data-agent-field="overview"
            className={`${inputClass} min-h-28`}
            value={form.overview}
            onChange={(e) => set("overview", e.target.value)}
          />
        </div>
        <LinesField
          id="highlights"
          label="Highlights"
          hint="One highlight per line."
          value={form.highlights}
          onChange={(v) => set("highlights", v)}
          placeholder={"Fast setup\nWorks on mobile\nNo credit card required"}
        />
        <LinesField
          id="tags"
          label="Tags"
          hint="One tag per line."
          value={form.tags}
          onChange={(v) => set("tags", v)}
          placeholder={"productivity\nai\nwriting"}
        />
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-neon">Rich content</h3>
        <div>
          <label htmlFor="tool-logo-url" className="mb-1 block text-sm text-muted">
            Logo URL
          </label>
          <input
            id="tool-logo-url"
            name="logoUrl"
            data-agent-field="logoUrl"
            className={inputClass}
            type="url"
            value={form.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
          />
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
        <LinesField
          id="screenshots"
          label="Screenshot URLs"
          hint="One image URL per line."
          value={form.screenshots}
          onChange={(v) => set("screenshots", v)}
          placeholder="https://example.com/screenshot-1.png"
          rows={3}
        />
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
          <label htmlFor="tool-who-is-it-for" className="mb-1 block text-sm text-muted">
            Who is it for?
          </label>
          <textarea
            id="tool-who-is-it-for"
            name="whoIsItFor"
            data-agent-field="whoIsItFor"
            className={`${inputClass} min-h-20`}
            value={form.whoIsItFor}
            onChange={(e) => set("whoIsItFor", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="tool-not-for-you-if" className="mb-1 block text-sm text-muted">
            Not for you if...
          </label>
          <textarea
            id="tool-not-for-you-if"
            name="notForYouIf"
            data-agent-field="notForYouIf"
            className={`${inputClass} min-h-16`}
            value={form.notForYouIf}
            onChange={(e) => set("notForYouIf", e.target.value)}
          />
        </div>
        <LinesField
          id="pros"
          label="Pros"
          hint="One pro per line."
          value={form.pros}
          onChange={(v) => set("pros", v)}
          placeholder="Easy to learn"
        />
        <LinesField
          id="cons"
          label="Cons"
          hint="One con per line."
          value={form.cons}
          onChange={(v) => set("cons", v)}
          placeholder="Limited free plan"
        />

        <StructuredField
          id="howItWorks"
          label="How it works"
          hint='One step per line: Title | Description'
          value={howItWorksToText(form.howItWorks)}
          onChange={(text) => set("howItWorks", textToHowItWorks(text))}
          placeholder={"Sign up | Create a free account\nUpload | Add your files\nShare | Send a link to collaborators"}
          rows={6}
        />

        <StructuredField
          id="pricing"
          label="Pricing tiers"
          hint="One tier per line: Label | Price | Note (note optional)."
          value={pricingToText(form.pricing)}
          onChange={(text) => set("pricing", textToPricing(text))}
          placeholder={"Free | $0 | Forever free tier\nPro | $9/mo | Billed annually"}
          rows={5}
        />

        <StructuredField
          id="faq"
          label="FAQ"
          hint="Question on the first line, answer on the following lines. Leave a blank line between items."
          value={faqToText(form.faq)}
          onChange={(text) => set("faq", textToFaq(text))}
          placeholder={
            "Is there a free plan?\nYes. The free tier includes core features.\n\nCan I cancel anytime?\nYes. You can cancel from account settings."
          }
          rows={8}
        />
      </section>
    </div>
  );
}
