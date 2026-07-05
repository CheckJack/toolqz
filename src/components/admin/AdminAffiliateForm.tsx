"use client";

import {
  AFFILIATE_PRIORITIES,
  AFFILIATE_STATUSES,
  AffiliateProgram,
  AffiliateUser,
} from "@/types/affiliate";
import { AFFILIATE_CATEGORIES } from "@/constants/affiliate-categories";

export interface AffiliateFormData {
  companyName: string;
  category: string;
  website: string;
  signupUrl: string;
  portalUrl: string;
  commission: string;
  isRecurring: string;
  cookieDuration: string;
  affiliateNetwork: string;
  status: string;
  priority: string;
  notes: string;
  contactEmail: string;
  rejectionReason: string;
  applicationId: string;
  affiliateUrl: string;
  assignedToId: string;
  toolId: string;
  contactedAt: string;
  nextFollowUpAt: string;
  appliedAt: string;
  approvedAt: string;
}

export const emptyForm: AffiliateFormData = {
  companyName: "",
  category: "",
  website: "",
  signupUrl: "",
  portalUrl: "",
  commission: "",
  isRecurring: "",
  cookieDuration: "",
  affiliateNetwork: "",
  status: "PENDING",
  priority: "MEDIUM",
  notes: "",
  contactEmail: "",
  rejectionReason: "",
  applicationId: "",
  affiliateUrl: "",
  assignedToId: "",
  toolId: "",
  contactedAt: "",
  nextFollowUpAt: "",
  appliedAt: "",
  approvedAt: "",
};

export function affiliateToForm(a: AffiliateProgram): AffiliateFormData {
  return {
    companyName: a.companyName,
    category: a.category ?? "",
    website: a.website ?? "",
    signupUrl: a.signupUrl ?? "",
    portalUrl: a.portalUrl ?? "",
    commission: a.commission ?? "",
    isRecurring: a.isRecurring === true ? "yes" : a.isRecurring === false ? "no" : "",
    cookieDuration: a.cookieDuration ?? "",
    affiliateNetwork: a.affiliateNetwork ?? "",
    status: a.status,
    priority: a.priority,
    notes: a.notes ?? "",
    contactEmail: a.contactEmail ?? "",
    rejectionReason: a.rejectionReason ?? "",
    applicationId: a.applicationId ?? "",
    affiliateUrl: a.affiliateUrl ?? "",
    assignedToId: a.assignedToId ?? "",
    toolId: a.toolId ?? "",
    contactedAt: a.contactedAt ? a.contactedAt.slice(0, 10) : "",
    nextFollowUpAt: a.nextFollowUpAt ? a.nextFollowUpAt.slice(0, 10) : "",
    appliedAt: a.appliedAt ? a.appliedAt.slice(0, 10) : "",
    approvedAt: a.approvedAt ? a.approvedAt.slice(0, 10) : "",
  };
}

export function formToPayload(form: AffiliateFormData) {
  return {
    companyName: form.companyName,
    category: form.category || null,
    website: form.website || null,
    signupUrl: form.signupUrl || null,
    portalUrl: form.portalUrl || null,
    commission: form.commission || null,
    isRecurring:
      form.isRecurring === "yes" ? true : form.isRecurring === "no" ? false : null,
    cookieDuration: form.cookieDuration || null,
    affiliateNetwork: form.affiliateNetwork || null,
    status: form.status,
    priority: form.priority,
    notes: form.notes || null,
    contactEmail: form.contactEmail || null,
    rejectionReason: form.rejectionReason || null,
    applicationId: form.applicationId || null,
    affiliateUrl: form.affiliateUrl || null,
    assignedToId: form.assignedToId || null,
    toolId: form.toolId || null,
    contactedAt: form.contactedAt || null,
    nextFollowUpAt: form.nextFollowUpAt || null,
    appliedAt: form.appliedAt || null,
    approvedAt: form.approvedAt || null,
  };
}

interface Props {
  form: AffiliateFormData;
  onChange: (form: AffiliateFormData) => void;
  users: AffiliateUser[];
  tools: {
    id: string;
    name: string;
    slug: string;
    published?: boolean;
    affiliate?: { id: string } | null;
  }[];
}

const inputClass =
  "w-full rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/50 focus:outline-none";

export function AdminAffiliateForm({ form, onChange, users, tools }: Props) {
  const set = (key: keyof AffiliateFormData, value: string) =>
    onChange({ ...form, [key]: value });

  const linkableTools = tools.filter(
    (t) => !t.affiliate || t.id === form.toolId
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm text-muted">Company name *</label>
        <input className={inputClass} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Category</label>
        <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
          <option value="">Select category</option>
          {AFFILIATE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Affiliate network</label>
        <input className={inputClass} value={form.affiliateNetwork} onChange={(e) => set("affiliateNetwork", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Website</label>
        <input className={inputClass} type="url" value={form.website} onChange={(e) => set("website", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Signup URL</label>
        <input className={inputClass} type="url" value={form.signupUrl} onChange={(e) => set("signupUrl", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Affiliate dashboard URL</label>
        <input
          className={inputClass}
          type="url"
          value={form.portalUrl}
          onChange={(e) => set("portalUrl", e.target.value)}
          placeholder="https://affiliates.example.com/login"
        />
        <p className="mt-1 text-xs text-muted">Login page for your affiliate account (partner portal).</p>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Commission</label>
        <input className={inputClass} value={form.commission} onChange={(e) => set("commission", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Recurring?</label>
        <select className={inputClass} value={form.isRecurring} onChange={(e) => set("isRecurring", e.target.value)}>
          <option value="">Unknown</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Cookie duration</label>
        <input className={inputClass} value={form.cookieDuration} onChange={(e) => set("cookieDuration", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Status</label>
        <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
          {AFFILIATE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Priority</label>
        <select className={inputClass} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
          {AFFILIATE_PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Assigned to</label>
        <select className={inputClass} value={form.assignedToId} onChange={(e) => set("assignedToId", e.target.value)}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Link to tool</label>
        <select className={inputClass} value={form.toolId} onChange={(e) => set("toolId", e.target.value)}>
          <option value="">None</option>
          {linkableTools.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.published === false ? " (draft)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Contact email</label>
        <input className={inputClass} type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Application ID</label>
        <input className={inputClass} value={form.applicationId} onChange={(e) => set("applicationId", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Contacted at</label>
        <input className={inputClass} type="date" value={form.contactedAt} onChange={(e) => set("contactedAt", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Next follow-up</label>
        <input className={inputClass} type="date" value={form.nextFollowUpAt} onChange={(e) => set("nextFollowUpAt", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Applied at</label>
        <input className={inputClass} type="date" value={form.appliedAt} onChange={(e) => set("appliedAt", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Approved at</label>
        <input className={inputClass} type="date" value={form.approvedAt} onChange={(e) => set("approvedAt", e.target.value)} />
      </div>
      {form.status === "REJECTED" && (
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-muted">Rejection reason</label>
          <input className={inputClass} value={form.rejectionReason} onChange={(e) => set("rejectionReason", e.target.value)} />
        </div>
      )}
      {(form.status === "ACTIVE" || form.toolId) && (
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-muted">Affiliate tracking URL</label>
          <input
            className={inputClass}
            type="url"
            value={form.affiliateUrl}
            onChange={(e) => set("affiliateUrl", e.target.value)}
            placeholder="https://..."
          />
          <p className="mt-1 text-xs text-muted">
            {form.status === "ACTIVE"
              ? "Synced to linked tool when saved."
              : "Add URL now; set status to ACTIVE to sync to the public site."}
          </p>
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm text-muted">Internal notes</label>
        <textarea className={`${inputClass} min-h-24`} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
    </div>
  );
}
