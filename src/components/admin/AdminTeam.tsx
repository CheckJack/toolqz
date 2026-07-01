"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SessionUser } from "@/lib/auth";
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

export function AdminTeam({ currentUser }: { currentUser: SessionUser }) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER",
  });

  const isAdmin = currentUser.role === "ADMIN";

  async function loadMembers() {
    setLoading(true);
    setLoadError("");
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      setMembers(await res.json());
    } else {
      const data = await res.json().catch(() => ({}));
      const msg = data.error ?? "Failed to load team";
      setLoadError(msg);
      toast(msg, "error");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add team member");
      return;
    }
    setMembers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setForm({ name: "", email: "", password: "", role: "MEMBER" });
    setShowForm(false);
    toast("Team member added");
  }

  async function handleRoleChange(id: string, role: string, currentRole: string) {
    if (role === "ADMIN" && currentRole !== "ADMIN") {
      if (!confirm("Grant admin access? This user can manage team, tools, and all CRM data.")) return;
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
    }
  }

  async function handleNameSave(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setEditId(null);
      toast("Name updated");
    }
  }

  async function handlePasswordReset(id: string) {
    if (resetPassword.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
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

  if (loading) return <AdminSkeleton rows={5} />;

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {loadError}
        <p className="mt-2 text-sm text-muted">
          If this started after a recent update, restart the dev server with{" "}
          <code className="text-neon">npm run dev:clean</code>.
        </p>
        <button onClick={() => void loadMembers()} className="mt-3 text-sm text-neon hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted">Manage admin access and workload</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-ink hover:bg-neon-dim"
          >
            {showForm ? "Cancel" : "Add team member"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleAdd} className="space-y-4 rounded-2xl border border-dark-border bg-dark-elevated p-6">
          <h2 className="font-semibold">New team member</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-muted">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white" required minLength={6} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white">
                <option value="MEMBER">Member — edit tools & CRM</option>
                <option value="ADMIN">Admin — full access incl. team & deletes</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-ink">Add member</button>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-left text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Email alerts</th>
                <th className="px-5 py-3 font-medium">Affiliates</th>
                <th className="px-5 py-3 font-medium">Last login</th>
                {isAdmin && <th className="px-5 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-dark-border/50 last:border-0">
                  <td className="px-5 py-4 font-medium">
                    {editId === member.id ? (
                      <div className="flex gap-2">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-lg border border-dark-border bg-dark px-2 py-1 text-sm" />
                        <button onClick={() => handleNameSave(member.id)} className="text-neon text-xs">Save</button>
                        <button onClick={() => setEditId(null)} className="text-xs text-muted hover:text-white">Cancel</button>
                      </div>
                    ) : (
                      <>
                        {member.name}
                        {member.id === currentUser.id && <span className="ml-2 text-xs text-neon">(you)</span>}
                      </>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted">{member.email}</td>
                  <td className="px-5 py-4">
                    {isAdmin && member.id !== currentUser.id ? (
                      <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value, member.role)} className="rounded-lg border border-dark-border bg-dark px-2 py-1 text-sm text-white">
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${member.role === "ADMIN" ? "bg-neon/10 text-neon" : "border border-dark-border text-muted"}`}>
                        {member.role === "ADMIN" ? "Admin" : "Member"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {isAdmin ? (
                      <label className="flex items-center gap-2 text-xs text-muted">
                        <input
                          type="checkbox"
                          checked={member.emailFollowUpReminders ?? true}
                          onChange={(e) => void handleEmailPrefChange(member.id, e.target.checked)}
                        />
                        Follow-ups
                      </label>
                    ) : (
                      <span className="text-xs text-muted">
                        {member.emailFollowUpReminders ? "On" : "Off"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold text-neon">
                    <Link
                      href={`/admin/affiliates?assignedToId=${member.id}`}
                      className="hover:underline"
                    >
                      {member.affiliateCount ?? 0}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {member.id !== currentUser.id && (
                          <>
                            <button onClick={() => { setEditId(member.id); setEditName(member.name); }} className="text-xs text-muted hover:text-white">Edit name</button>
                            <button onClick={() => setResetId(member.id)} className="text-xs text-muted hover:text-neon">Reset password</button>
                            <button onClick={() => handleRemove(member.id)} className="text-xs text-red-400">Remove</button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-elevated p-6">
            <h3 className="mb-4 font-semibold">Reset password</h3>
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="mb-4 w-full rounded-xl border border-dark-border bg-dark px-4 py-2 text-white"
            />
            <div className="flex gap-2">
              <button onClick={() => handlePasswordReset(resetId)} className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink">Save</button>
              <button onClick={() => { setResetId(null); setResetPassword(""); }} className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
        <p className="text-sm text-muted">Only admins can add or remove team members.</p>
      )}
    </div>
  );
}
