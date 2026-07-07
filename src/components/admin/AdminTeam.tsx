"use client";

import Link from "next/link";
import {
  KeyRound,
  Pencil,
  Search,
  Shield,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SessionUser } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH, passwordTooShortMessage } from "@/lib/password-policy";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  emailFollowUpReminders: boolean;
  affiliateCount: number;
}

type RoleTab = "" | "ADMIN" | "MEMBER";

const ROLE_TABS: { value: RoleTab; label: string }[] = [
  { value: "", label: "All" },
  { value: "ADMIN", label: "Admins" },
  { value: "MEMBER", label: "Members" },
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "MEMBER",
};

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none";

function formatLastLogin(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function AdminTeam({ currentUser }: { currentUser: SessionUser }) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleTab>("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const isAdmin = currentUser.role === "ADMIN";

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load team");
      }
      setMembers(await res.json());
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to load team";
      setLoadError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const tabCounts = useMemo(
    () => ({
      all: members.length,
      ADMIN: members.filter((m) => m.role === "ADMIN").length,
      MEMBER: members.filter((m) => m.role === "MEMBER").length,
    }),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    return members.filter((member) => {
      if (roleFilter === "ADMIN" && member.role !== "ADMIN") return false;
      if (roleFilter === "MEMBER" && member.role !== "MEMBER") return false;
      if (!query) return true;
      return (
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
      );
    });
  }, [members, searchInput, roleFilter]);

  function tabCount(value: RoleTab): number {
    if (value === "ADMIN") return tabCounts.ADMIN;
    if (value === "MEMBER") return tabCounts.MEMBER;
    return tabCounts.all;
  }

  function clearFilters() {
    setSearchInput("");
    setRoleFilter("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Failed to add team member");
        return;
      }
      setMembers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(emptyForm);
      setShowForm(false);
      toast("Team member added");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(id: string, role: string, currentRole: string) {
    if (role === "ADMIN" && currentRole !== "ADMIN") {
      if (!confirm("Grant admin access? This user can manage team, tools, and all CRM data.")) {
        return;
      }
    }
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      toast("Role updated");
    } else {
      toast("Role update failed", "error");
    }
  }

  async function handleNameSave(id: string) {
    const name = editName.trim();
    if (!name) {
      toast("Name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
        setEditId(null);
        toast("Name updated");
      } else {
        toast("Name update failed", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset(id: string) {
    if (resetPassword.length < MIN_PASSWORD_LENGTH) {
      toast(passwordTooShortMessage(), "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      if (res.ok) {
        setResetId(null);
        setResetPassword("");
        toast("Password reset");
      } else {
        toast("Password reset failed", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailPrefChange(id: string, enabled: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailFollowUpReminders: enabled }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      toast(`Email reminders ${enabled ? "enabled" : "disabled"}`);
    } else {
      toast("Failed to update preference", "error");
    }
  }

  async function handleRemove(id: string) {
    const member = members.find((m) => m.id === id);
    const count = member?.affiliateCount ?? 0;
    const msg =
      count > 0
        ? `Remove ${member?.name}? ${count} assigned CRM program${count === 1 ? "" : "s"} will be unassigned.`
        : `Remove ${member?.name} from the team?`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "Failed to remove member", "error");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast("Member removed");
  }

  const adminCount = tabCounts.ADMIN;
  const description =
    members.length > 0
      ? `${members.length} member${members.length === 1 ? "" : "s"} · ${adminCount} admin${adminCount === 1 ? "" : "s"}`
      : "Manage admin access and workload";

  if (loading) return <AdminSkeleton rows={6} />;

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {loadError}
        <p className="mt-2 text-sm text-muted">
          If this started after a recent update, restart the dev server with{" "}
          <code className="text-neon">npm run dev:clean</code>.
        </p>
        <button type="button" onClick={() => void loadMembers()} className="admin-link-accent mt-3">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Team"
        description={description}
        action={
          isAdmin ? (
            <button type="button" onClick={() => setShowForm(true)} className="admin-btn-primary">
              Add team member
            </button>
          ) : undefined
        }
      />

      {!isAdmin && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          You can view the team roster. Only admins can add, edit, or remove members.
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="admin-segmented w-fit max-w-full overflow-x-auto">
            {ROLE_TABS.map((tab) => {
              const active = roleFilter === tab.value;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setRoleFilter(tab.value)}
                  className={`admin-segmented-btn whitespace-nowrap ${active ? "admin-segmented-btn-active" : ""}`}
                >
                  {tab.label}
                  <span className="ml-1.5 tabular-nums opacity-70">{tabCount(tab.value)}</span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
            />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dark-border bg-dark text-muted">
              <Users className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-muted">
              {members.length === 0
                ? "No team members yet."
                : "No members match your filters."}
            </p>
            {members.length === 0 && isAdmin ? (
              <button type="button" onClick={() => setShowForm(true)} className="admin-link-accent mt-3">
                Add your first team member
              </button>
            ) : searchInput || roleFilter ? (
              <button type="button" onClick={clearFilters} className="admin-link-accent mt-3">
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th className="hidden sm:table-cell">Email alerts</th>
                  <th className="text-right">Affiliates</th>
                  <th className="hidden md:table-cell">Last login</th>
                  {isAdmin && <th className="w-12" aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const isSelf = member.id === currentUser.id;
                  const lastLogin = formatLastLogin(member.lastLoginAt);

                  return (
                    <tr key={member.id}>
                      <td className="min-w-[12rem]">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-white">{member.name}</p>
                          {isSelf && (
                            <span className="rounded-md bg-neon/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neon">
                              You
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted">{member.email}</p>
                        <p className="mt-1 text-[11px] text-muted-dim sm:hidden">
                          Alerts {member.emailFollowUpReminders ? "on" : "off"}
                          {lastLogin ? ` · ${lastLogin}` : " · Never logged in"}
                        </p>
                      </td>
                      <td>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            member.role === "ADMIN"
                              ? "bg-neon/10 text-neon"
                              : "bg-dark-border/80 text-muted"
                          }`}
                        >
                          {member.role === "ADMIN" ? "Admin" : "Member"}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() =>
                              void handleEmailPrefChange(
                                member.id,
                                !member.emailFollowUpReminders
                              )
                            }
                            className={`admin-toggle ${member.emailFollowUpReminders ? "admin-toggle-on-emerald" : ""}`}
                          >
                            {member.emailFollowUpReminders ? "On" : "Off"}
                          </button>
                        ) : (
                          <span className="text-muted">
                            {member.emailFollowUpReminders ? "On" : "Off"}
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        {member.affiliateCount > 0 ? (
                          <Link
                            href={`/admin/affiliates?assignedToId=${member.id}`}
                            className="font-medium tabular-nums text-neon hover:underline"
                          >
                            {member.affiliateCount}
                          </Link>
                        ) : (
                          <span className="tabular-nums text-muted">0</span>
                        )}
                      </td>
                      <td className="hidden text-muted md:table-cell">
                        {lastLogin ?? "Never"}
                      </td>
                      {isAdmin && (
                        <td className="text-right">
                          {!isSelf ? (
                            <TeamRowActions
                              member={member}
                              onEdit={() => {
                                setEditId(member.id);
                                setEditName(member.name);
                              }}
                              onResetPassword={() => setResetId(member.id)}
                              onToggleRole={() =>
                                void handleRoleChange(
                                  member.id,
                                  member.role === "ADMIN" ? "MEMBER" : "ADMIN",
                                  member.role
                                )
                              }
                              onRemove={() => void handleRemove(member.id)}
                            />
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setShowForm(false);
            setForm(emptyForm);
            setFormError("");
          }}
        >
          <form
            onSubmit={(e) => void handleAdd(e)}
            className="admin-card max-h-[90vh] w-full max-w-lg overflow-y-auto admin-card-pad"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-section-title">Add team member</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-muted">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputClass}
                >
                  <option value="MEMBER">Member — edit tools & CRM</option>
                  <option value="ADMIN">Admin — full access incl. team</option>
                </select>
              </div>
            </div>
            {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}
            <div className="mt-6 flex gap-2">
              <button type="submit" disabled={saving} className="admin-btn-primary disabled:opacity-50">
                {saving ? "Adding…" : "Add member"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                  setFormError("");
                }}
                className="admin-toolbar-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setEditId(null)}
        >
          <div
            className="admin-card w-full max-w-md admin-card-pad"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="admin-section-title">Edit name</h3>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm text-muted">Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => void handleNameSave(editId)}
                disabled={saving}
                className="admin-btn-primary disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditId(null)} className="admin-toolbar-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {resetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setResetId(null);
            setResetPassword("");
          }}
        >
          <div
            className="admin-card w-full max-w-md admin-card-pad"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="admin-section-title">Reset password</h3>
            <p className="mt-2 text-sm text-muted">
              Set a new password for{" "}
              <span className="text-white">
                {members.find((m) => m.id === resetId)?.name}
              </span>
              .
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm text-muted">New password</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={inputClass}
                minLength={MIN_PASSWORD_LENGTH}
                autoFocus
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => void handlePasswordReset(resetId)}
                disabled={saving}
                className="admin-btn-primary disabled:opacity-50"
              >
                {saving ? "Saving…" : "Reset password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetId(null);
                  setResetPassword("");
                }}
                className="admin-toolbar-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamRowActions({
  member,
  onEdit,
  onResetPassword,
  onToggleRole,
  onRemove,
}: {
  member: TeamMember;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleRole: () => void;
  onRemove: () => void;
}) {
  return (
    <AdminRowActionsMenu label={`Actions for ${member.name}`} minWidth="11rem">
      {(close) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onEdit();
            }}
            className="admin-menu-item w-full"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Edit name
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onResetPassword();
            }}
            className="admin-menu-item w-full"
          >
            <KeyRound className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Reset password
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onToggleRole();
            }}
            className="admin-menu-item w-full"
          >
            {member.role === "ADMIN" ? (
              <UserMinus className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            ) : (
              <Shield className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            )}
            {member.role === "ADMIN" ? "Make member" : "Make admin"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onRemove();
            }}
            className="admin-menu-item w-full text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Remove
          </button>
        </>
      )}
    </AdminRowActionsMenu>
  );
}
