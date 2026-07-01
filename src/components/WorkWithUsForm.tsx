"use client";

import { useState } from "react";

const productTypes = [
  { value: "", label: "Select type…" },
  { value: "saas", label: "SaaS / software" },
  { value: "digital", label: "Digital product" },
  { value: "service", label: "Online service" },
  { value: "app", label: "Mobile or web app" },
  { value: "other", label: "Other" },
] as const;

const fieldClass =
  "w-full rounded-lg border border-dark-border bg-dark-elevated px-4 py-2.5 text-[15px] text-white placeholder:text-muted-dim transition-[border-color,box-shadow] focus:border-white/20 focus:outline-none focus:ring-[3px] focus:ring-neon/10";

export function WorkWithUsForm() {
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    productType: "",
    message: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/partner-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website_url: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      setForm({
        companyName: "",
        contactName: "",
        email: "",
        website: "",
        productType: "",
        message: "",
      });
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="surface rounded-xl p-8 text-center">
        <p className="text-[16px] font-medium text-white">Thanks — we got your message.</p>
        <p className="mt-2 text-sm text-muted">
          We&apos;ll review your submission and get back to you if it&apos;s a good fit
          for TOOLQZ.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm text-neon hover:underline"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        type="text"
        name="website_url"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] text-muted">Company / product name</label>
          <input
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className={fieldClass}
            placeholder="Acme Inc."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] text-muted">Your name</label>
          <input
            required
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            className={fieldClass}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] text-muted">Work email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={fieldClass}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] text-muted">Website (optional)</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className={fieldClass}
            placeholder="https://"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] text-muted">What are you promoting?</label>
        <select
          required
          value={form.productType}
          onChange={(e) => setForm({ ...form, productType: e.target.value })}
          className={fieldClass}
        >
          {productTypes.map((opt) => (
            <option key={opt.value || "empty"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] text-muted">Tell us about your product</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${fieldClass} resize-y leading-relaxed`}
          placeholder="What does it do, who is it for, and do you have an affiliate or partnership program?"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="btn-primary w-full sm:w-auto disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
