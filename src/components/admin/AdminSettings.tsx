"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { EmailReminderSetting } from "@/components/admin/EmailReminderSetting";
import { useToast } from "@/components/admin/Toast";
import { MIN_PASSWORD_LENGTH, passwordTooShortMessage } from "@/lib/password-policy";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  emailFollowUpReminders: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  affiliateCount: number;
}

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none";

function formatWhen(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [savingPrefs, setSavingPrefs] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    fetch("/api/admin/me")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data: ProfileData) => {
        setProfile(data);
        setName(data.name);
      })
      .catch(() => {
        setLoadError("Could not load profile settings");
        toast("Failed to load profile", "error");
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || name.trim() === profile.name) {
      toast("No changes to save");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not update profile", "error");
        return;
      }
      setProfile(data);
      setName(data.name);
      toast("Profile updated");
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast(passwordTooShortMessage(), "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not update password", "error");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Password updated");
    } finally {
      setSavingPassword(false);
    }
  }

  async function toggleEmailReminders(enabled: boolean) {
    if (!profile) return;
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailFollowUpReminders: enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not update preference", "error");
        return;
      }
      setProfile(data);
      toast(enabled ? "Email reminders enabled" : "Email reminders disabled");
    } finally {
      setSavingPrefs(false);
    }
  }

  const description = profile
    ? `${profile.email} · ${profile.role === "ADMIN" ? "Admin" : "Member"}`
    : "Your account and notification preferences";

  if (loading && !profile) return <AdminSkeleton rows={6} />;

  if (loadError && !profile) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {loadError}
        <button type="button" onClick={load} className="admin-link-accent mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader hideTitle title="Settings" description={description} />

      <form onSubmit={(e) => void saveProfile(e)} className="admin-card admin-card-pad space-y-4">
        <div>
          <h2 className="admin-section-title">Profile</h2>
          <p className="mt-1 text-[12px] text-muted">Update how your name appears across the admin.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-muted">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted">Email</label>
            <input
              value={profile.email}
              readOnly
              className={`${inputClass} cursor-not-allowed opacity-70`}
            />
            <p className="mt-1 text-[11px] text-muted-dim">Contact an admin to change your login email.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-[12px] text-muted">
          <span>
            Role{" "}
            <span
              className={`ml-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                profile.role === "ADMIN"
                  ? "bg-neon/10 text-neon"
                  : "bg-dark-border/80 text-muted"
              }`}
            >
              {profile.role === "ADMIN" ? "Admin" : "Member"}
            </span>
          </span>
          <span>Last login {formatWhen(profile.lastLoginAt)}</span>
          {profile.affiliateCount > 0 && (
            <Link
              href={`/admin/affiliates?assignedToId=${profile.id}`}
              className="admin-link-accent"
            >
              {profile.affiliateCount} assigned program{profile.affiliateCount === 1 ? "" : "s"}
            </Link>
          )}
        </div>

        <button
          type="submit"
          disabled={savingProfile || name.trim() === profile.name}
          className="admin-btn-primary disabled:opacity-50"
        >
          {savingProfile ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form onSubmit={(e) => void savePassword(e)} className="admin-card admin-card-pad space-y-4">
        <div>
          <h2 className="admin-section-title">Password</h2>
          <p className="mt-1 text-[12px] text-muted">Use a strong password you don&apos;t reuse elsewhere.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-1.5 block text-sm text-muted">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={
            savingPassword || !currentPassword || !newPassword || !confirmPassword
          }
          className="admin-btn-primary disabled:opacity-50"
        >
          {savingPassword ? "Updating…" : "Update password"}
        </button>
      </form>

      <EmailReminderSetting
        enabled={profile.emailFollowUpReminders}
        saving={savingPrefs}
        onChange={(enabled) => void toggleEmailReminders(enabled)}
        footerLink={{ href: "/admin/notifications", label: "View notification history" }}
      />
    </div>
  );
}
