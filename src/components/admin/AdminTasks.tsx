"use client";

import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  List,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  TASK_PRIORITIES,
  TASK_SECTIONS,
  TASK_SECTION_LABELS,
  TASK_STATUSES,
  type TaskPriority,
  type TaskSection,
  type TaskStatus,
} from "@/constants/admin-tasks";
import {
  AFFILIATE_SIGNUP_OUTCOME_STATUSES,
  extractAffiliateSignupCompanyName,
  isAffiliateSignupTask,
  isTaskOverdue,
  pickAffiliateProgramId,
  resolveAffiliateProgramId,
  type AffiliateSignupOutcomeStatus,
} from "@/lib/admin-tasks";
import { SessionUser } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";

interface TeamMember {
  id: string;
  name: string;
}

interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  section: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  affiliateProgramId: string | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
  completedAt: string | null;
  createdAt: string;
}

type AssigneeFilter = "" | "me" | "unassigned";
type ViewMode = "list" | "board";

interface TaskCounts {
  TODO: number;
  IN_PROGRESS: number;
  DONE: number;
  sections: Record<string, number>;
}

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none";

const inlineCellInputClass =
  "w-full min-w-0 border-0 bg-transparent px-0 py-1 text-sm text-white placeholder:text-muted-dim focus:outline-none focus:ring-0";

const inlineCellSelectClass =
  "max-w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-xs text-white hover:border-dark-border focus:border-neon/40 focus:outline-none";

const ASSIGNEE_FILTERS: { value: AssigneeFilter; label: string }[] = [
  { value: "", label: "Everyone" },
  { value: "me", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "text-muted",
  IN_PROGRESS: "text-blue-400",
  DONE: "text-emerald-400",
};

function priorityClass(priority: TaskPriority) {
  switch (priority) {
    case "URGENT":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "HIGH":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    case "LOW":
      return "border-dark-border bg-dark/60 text-muted";
    default:
      return "border-dark-border bg-dark/40 text-muted";
  }
}

function formatDueDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TaskQuickLink({ href, label }: { href: string; label: string }) {
  const className = "mt-1 inline-flex items-center gap-1 text-[11px] text-neon hover:underline";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <ExternalLink className="h-3 w-3" />
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      <ExternalLink className="h-3 w-3" />
      {label}
    </Link>
  );
}

function defaultSection(sectionFilter: TaskSection | ""): TaskSection {
  return sectionFilter || "general";
}

function InlineAddTaskRow({
  placeholder,
  sectionFilter,
  defaultStatus = "TODO",
  assignToMe,
  userId,
  onCreated,
  autoFocus,
  colSpan = 7,
  inputRef,
}: {
  placeholder: string;
  sectionFilter: TaskSection | "";
  defaultStatus?: TaskStatus;
  assignToMe: boolean;
  userId: string;
  onCreated: (task: AdminTask) => void;
  autoFocus?: boolean;
  colSpan?: number;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus, ref]);

  const submit = async () => {
    const title = value.trim();
    if (!title || saving) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          section: defaultSection(sectionFilter),
          status: defaultStatus,
          assignedToId: assignToMe ? userId : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to add task");

      setValue("");
      onCreated(data.task as AdminTask);
      ref.current?.focus();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add task", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-dark-border/80 bg-dark/20">
      <td colSpan={colSpan} className="!py-2">
        <div className="flex items-center gap-2 px-1">
          <Plus className="h-4 w-4 shrink-0 text-muted-dim" strokeWidth={1.75} />
          <input
            ref={ref}
            type="text"
            value={value}
            disabled={saving}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={placeholder}
            className={`${inlineCellInputClass} text-[13px] placeholder:italic`}
          />
          {value.trim() && (
            <span className="hidden shrink-0 text-[10px] text-muted-dim sm:inline">Enter ↵</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function TaskListRow({
  task,
  team,
  user,
  isAdmin,
  showSectionColumn,
  expanded,
  onToggleExpand,
  onPatch,
  onStatusChange,
  onDelete,
  statusBusy = false,
  colSpan = 7,
}: {
  task: AdminTask;
  team: TeamMember[];
  user: SessionUser;
  isAdmin: boolean;
  showSectionColumn: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onPatch: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onStatusChange: (task: AdminTask, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  statusBusy?: boolean;
  colSpan?: number;
}) {
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [descDraft, setDescDraft] = useState(task.description ?? "");
  const [linkUrlDraft, setLinkUrlDraft] = useState(task.linkUrl ?? "");
  const [linkLabelDraft, setLinkLabelDraft] = useState(task.linkLabel ?? "");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(task.title);
  }, [task.title]);

  useEffect(() => {
    setDescDraft(task.description ?? "");
    setLinkUrlDraft(task.linkUrl ?? "");
    setLinkLabelDraft(task.linkLabel ?? "");
  }, [task.description, task.linkUrl, task.linkLabel]);

  const overdue = isTaskOverdue(task.dueAt, task.status);
  const dueLabel = formatDueDate(task.dueAt);
  const sectionLabel = TASK_SECTION_LABELS[task.section as TaskSection] ?? task.section;
  const done = task.status === "DONE";

  const saveTitle = async () => {
    const next = titleDraft.trim();
    if (!next || next === task.title) {
      setTitleDraft(task.title);
      return;
    }
    await onPatch(task.id, { title: next });
  };

  const saveDescription = async () => {
    const next = descDraft.trim() || null;
    if (next === (task.description?.trim() || null)) return;
    await onPatch(task.id, { description: next });
  };

  const saveLinks = async () => {
    const url = linkUrlDraft.trim() || null;
    const label = linkLabelDraft.trim() || null;
    if (url === task.linkUrl && label === task.linkLabel) return;
    await onPatch(task.id, { linkUrl: url, linkLabel: label });
  };

  return (
    <>
      <tr className={`group ${done ? "opacity-70" : ""}`}>
        <td className="min-w-[14rem]">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onToggleExpand}
              className="mt-1 shrink-0 text-muted-dim hover:text-white"
              aria-label={expanded ? "Collapse details" : "Expand details"}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              type="checkbox"
              checked={done}
              disabled={statusBusy}
              onChange={() => void onStatusChange(task, done ? "TODO" : "DONE")}
              className="mt-1.5 h-4 w-4 shrink-0 rounded border-dark-border bg-dark accent-neon"
              aria-label={done ? "Mark not done" : "Mark done"}
            />
            <div className="min-w-0 flex-1">
              <input
                ref={titleRef}
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => void saveTitle()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void saveTitle();
                    titleRef.current?.blur();
                  }
                  if (e.key === "Escape") {
                    setTitleDraft(task.title);
                    titleRef.current?.blur();
                  }
                }}
                className={`${inlineCellInputClass} font-medium ${done ? "text-muted line-through" : "text-white"}`}
              />
              {!expanded && task.description && (
                <p className="mt-0.5 line-clamp-1 pl-0 text-[11px] text-muted">{task.description}</p>
              )}
              {!expanded && task.linkUrl && (
                <TaskQuickLink
                  href={task.linkUrl}
                  label={task.linkLabel || "Open link"}
                />
              )}
              {showSectionColumn && (
                <p className="mt-1 text-[11px] text-muted md:hidden">{sectionLabel}</p>
              )}
            </div>
          </div>
        </td>
        {showSectionColumn && (
          <td className="hidden md:table-cell">
            <select
              value={task.section}
              onChange={(e) => void onPatch(task.id, { section: e.target.value })}
              className={`${inlineCellSelectClass} text-muted`}
            >
              {TASK_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </td>
        )}
        <td>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
            className={`${inlineCellSelectClass} ${STATUS_COLORS[task.status]}`}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </td>
        <td className="hidden sm:table-cell">
          <select
            value={task.priority}
            onChange={(e) => void onPatch(task.id, { priority: e.target.value })}
            className={`${inlineCellSelectClass} ${priorityClass(task.priority)}`}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </td>
        <td className="hidden lg:table-cell">
          <select
            value={task.assignedToId ?? ""}
            onChange={(e) =>
              void onPatch(task.id, { assignedToId: e.target.value || null })
            }
            className={`${inlineCellSelectClass} max-w-[9rem] truncate text-muted`}
          >
            <option value="">Unassigned</option>
            <option value={user.id}>Me</option>
            {team
              .filter((m) => m.id !== user.id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </td>
        <td className={`hidden sm:table-cell ${overdue ? "text-red-300" : "text-muted"}`}>
          <input
            type="date"
            value={task.dueAt ? task.dueAt.slice(0, 10) : ""}
            onChange={(e) =>
              void onPatch(task.id, { dueAt: e.target.value || null })
            }
            className={`${inlineCellSelectClass} max-w-[8.5rem] ${overdue ? "text-red-300" : ""}`}
            title={dueLabel ? `Due ${dueLabel}` : "Set due date"}
          />
        </td>
        <td>
          {isAdmin && (
            <AdminRowActionsMenu label={`Actions for ${task.title}`}>
              {(close) => (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                  onClick={() => {
                    onDelete(task.id);
                    close();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </AdminRowActionsMenu>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-dark/30">
          <td colSpan={colSpan} className="!pt-0">
            <div className="ml-9 space-y-3 pb-3 pr-2">
              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-dim">
                  Notes
                </span>
                <textarea
                  rows={2}
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={() => void saveDescription()}
                  placeholder="Add notes…"
                  className={`${inputClass} mt-1 text-xs`}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-dim">
                    Link URL
                  </span>
                  <input
                    value={linkUrlDraft}
                    onChange={(e) => setLinkUrlDraft(e.target.value)}
                    onBlur={() => void saveLinks()}
                    placeholder="/admin/tools"
                    className={`${inputClass} mt-1 text-xs`}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-dim">
                    Link label
                  </span>
                  <input
                    value={linkLabelDraft}
                    onChange={(e) => setLinkLabelDraft(e.target.value)}
                    onBlur={() => void saveLinks()}
                    placeholder="Open in admin"
                    className={`${inputClass} mt-1 text-xs`}
                  />
                </label>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TaskCard({
  task,
  isAdmin,
  onPatch,
  onStatusChange,
  onDelete,
  statusBusy = false,
}: {
  task: AdminTask;
  isAdmin: boolean;
  onPatch: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onStatusChange: (task: AdminTask, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  statusBusy?: boolean;
}) {
  const overdue = isTaskOverdue(task.dueAt, task.status);
  const dueLabel = formatDueDate(task.dueAt);
  const sectionLabel = TASK_SECTION_LABELS[task.section as TaskSection] ?? task.section;
  const [titleDraft, setTitleDraft] = useState(task.title);

  useEffect(() => setTitleDraft(task.title), [task.title]);

  return (
    <article className="rounded-lg border border-dark-border bg-dark/50 p-3 shadow-sm transition hover:border-border-hover">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={task.status === "DONE"}
          disabled={statusBusy}
          onChange={() =>
            void onStatusChange(task, task.status === "DONE" ? "TODO" : "DONE")
          }
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-dark-border bg-dark accent-neon"
        />
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              const next = titleDraft.trim();
              if (next && next !== task.title) void onPatch(task.id, { title: next });
              else setTitleDraft(task.title);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setTitleDraft(task.title);
            }}
            className={`${inlineCellInputClass} font-medium text-white`}
          />
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{task.description}</p>
          )}
        </div>
        {isAdmin && (
          <AdminRowActionsMenu label={`Actions for ${task.title}`}>
            {(close) => (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                onClick={() => {
                  onDelete(task.id);
                  close();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </AdminRowActionsMenu>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
        <span className="text-[10px] uppercase tracking-wide text-muted-dim">{sectionLabel}</span>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
          className={`${inlineCellSelectClass} ${STATUS_COLORS[task.status]}`}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${priorityClass(task.priority)}`}
        >
          {TASK_PRIORITIES.find((p) => p.value === task.priority)?.label ?? task.priority}
        </span>
        {task.assignedTo && (
          <span className="text-[11px] text-muted">{task.assignedTo.name}</span>
        )}
        {dueLabel && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] ${overdue ? "text-red-300" : "text-muted"}`}
          >
            <Calendar className="h-3 w-3" />
            {overdue ? `Overdue · ${dueLabel}` : dueLabel}
          </span>
        )}
      </div>

      {task.linkUrl && (
        <TaskQuickLink
          href={task.linkUrl}
          label={task.linkLabel || "Open link"}
        />
      )}
    </article>
  );
}

export function AdminTasks({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const isAdmin = user.role === "ADMIN";
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [counts, setCounts] = useState<TaskCounts | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [section, setSection] = useState<TaskSection | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [affiliateDonePrompt, setAffiliateDonePrompt] = useState<{
    task: AdminTask;
    affiliateProgramId: string;
  } | null>(null);
  const [affiliateOutcomeStatus, setAffiliateOutcomeStatus] =
    useState<AffiliateSignupOutcomeStatus>("ACTIVE");
  const [affiliateDoneSaving, setAffiliateDoneSaving] = useState(false);
  const [affiliateResolving, setAffiliateResolving] = useState(false);
  const listAddRef = useRef<HTMLInputElement | null>(null);

  const showSectionColumn = !section;
  const tableColSpan = showSectionColumn ? 7 : 6;

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (res) => {
        if (!res.ok) return;
        const users = (await res.json()) as { id: string; name: string }[];
        setTeam(users.map((u) => ({ id: u.id, name: u.name })));
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (section) params.set("section", section);
      if (assigneeFilter) params.set("assignee", assigneeFilter);
      if (search) params.set("search", search);

      const tasksRes = await fetch(`/api/admin/tasks?${params}`);
      const data = await tasksRes.json().catch(() => ({}));

      if (!tasksRes.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to load tasks");
      }

      setTasks(data.items ?? []);
      setCounts(data.counts ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load tasks";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [section, assigneeFilter, search, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, AdminTask[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const task of tasks) {
      if (grouped[task.status]) grouped[task.status].push(task);
    }
    return grouped;
  }, [tasks]);

  const mergeTask = useCallback((updated: AdminTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const appendTask = useCallback((task: AdminTask) => {
    setTasks((prev) => [...prev, task]);
    setCounts((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [task.status]: (prev[task.status] ?? 0) + 1,
        sections: {
          ...prev.sections,
          [task.section]: (prev.sections[task.section] ?? 0) + 1,
        },
      };
    });
  }, []);

  const patchTask = useCallback(
    async (id: string, payload: Record<string, unknown>) => {
      let before: AdminTask | undefined;
      setTasks((prev) => {
        before = prev.find((t) => t.id === id);
        return prev.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...payload } as AdminTask;
          if (payload.assignedToId !== undefined) {
            const assigneeId = payload.assignedToId as string | null;
            next.assignedTo = assigneeId
              ? team.find((m) => m.id === assigneeId)
                ? { id: assigneeId, name: team.find((m) => m.id === assigneeId)!.name }
                : assigneeId === user.id
                  ? { id: user.id, name: user.name }
                  : null
              : null;
          }
          return next;
        });
      });

      try {
        const res = await fetch(`/api/admin/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Failed to update task");
        mergeTask(data.task as AdminTask);
        void load();
      } catch (err) {
        if (before) {
          const snapshot = before;
          setTasks((prev) => prev.map((t) => (t.id === id ? snapshot : t)));
        }
        toast(err instanceof Error ? err.message : "Failed to update task", "error");
      }
    },
    [team, user.id, user.name, mergeTask, load, toast]
  );

  const lookupAffiliateProgramId = useCallback(async (task: AdminTask): Promise<string | null> => {
    const direct = resolveAffiliateProgramId(task);
    if (direct) return direct;

    const companyName = extractAffiliateSignupCompanyName(task.title);
    if (!companyName) return null;

    const res = await fetch(
      `/api/admin/affiliates?search=${encodeURIComponent(companyName)}&pageSize=100`
    );
    if (!res.ok) return null;

    const data = (await res.json().catch(() => ({}))) as {
      items?: { id: string; companyName: string; assignedToId: string | null }[];
    };
    return pickAffiliateProgramId(data.items ?? [], companyName, task.assignedToId);
  }, []);

  const handleStatusChange = useCallback(
    async (task: AdminTask, newStatus: TaskStatus) => {
      if (newStatus === "DONE" && task.status !== "DONE" && isAffiliateSignupTask(task)) {
        setAffiliateResolving(true);
        try {
          const affiliateProgramId = await lookupAffiliateProgramId(task);
          if (affiliateProgramId) {
            if (!task.affiliateProgramId) {
              void fetch(`/api/admin/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ affiliateProgramId }),
              }).then((res) => {
                if (res.ok) {
                  setTasks((prev) =>
                    prev.map((t) => (t.id === task.id ? { ...t, affiliateProgramId } : t))
                  );
                }
              });
            }
            setAffiliateOutcomeStatus("ACTIVE");
            setAffiliateDonePrompt({
              task: { ...task, affiliateProgramId },
              affiliateProgramId,
            });
            return;
          }
          toast("Could not find the linked affiliate program in CRM", "error");
        } finally {
          setAffiliateResolving(false);
        }
        return;
      }
      void patchTask(task.id, { status: newStatus });
    },
    [lookupAffiliateProgramId, patchTask, toast]
  );

  const completeAffiliateSignupTask = useCallback(async () => {
    if (!affiliateDonePrompt) return;

    const { task, affiliateProgramId } = affiliateDonePrompt;
    setAffiliateDoneSaving(true);

    try {
      if (affiliateOutcomeStatus === "ACTIVE") {
        const affRes = await fetch(`/api/admin/affiliates/${affiliateProgramId}`);
        if (affRes.ok) {
          const program = (await affRes.json()) as { companyName: string; affiliateUrl?: string | null };
          if (!program.affiliateUrl) {
            const ok = confirm(
              `Set "${program.companyName}" to Active without an affiliate tracking URL? You can add the URL on the detail page.`
            );
            if (!ok) return;
          }
        }
      }

      const [taskRes, affiliateRes] = await Promise.all([
        fetch(`/api/admin/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "DONE" }),
        }),
        fetch(`/api/admin/affiliates/${affiliateProgramId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: affiliateOutcomeStatus }),
        }),
      ]);

      const taskData = await taskRes.json().catch(() => ({}));
      const affiliateData = await affiliateRes.json().catch(() => ({}));

      if (!taskRes.ok) {
        throw new Error(
          typeof taskData.error === "string" ? taskData.error : "Failed to mark task done"
        );
      }
      if (!affiliateRes.ok) {
        throw new Error(
          typeof affiliateData.error === "string"
            ? affiliateData.error
            : "Failed to update affiliate status"
        );
      }

      mergeTask(taskData.task as AdminTask);
      setAffiliateDonePrompt(null);
      toast("Task completed and affiliate CRM updated", "success");
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to complete task", "error");
    } finally {
      setAffiliateDoneSaving(false);
    }
  }, [affiliateDonePrompt, affiliateOutcomeStatus, mergeTask, load, toast]);

  const handleInlineCreated = useCallback(
    (task: AdminTask) => {
      appendTask(task);
      void load();
    },
    [appendTask, load]
  );

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTasks((prev) => prev.filter((t) => t.id !== id));
      void load();
    } catch {
      toast("Failed to delete task", "error");
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const focusListAdd = () => {
    listAddRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Tasks"
        description={`${tasks.length} task${tasks.length === 1 ? "" : "s"} · type in the list to add${view === "board" ? " · board view" : ""}`}
        action={
          <button type="button" onClick={focusListAdd} className="admin-toolbar-btn inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New row
          </button>
        }
      />

      <div className="admin-card overflow-hidden">
        <div className="space-y-3 border-b border-dark-border px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search tasks…"
                className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value as AssigneeFilter)}
                className="min-w-0 flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:min-w-[10.5rem] sm:flex-none"
              >
                {ASSIGNEE_FILTERS.map((f) => (
                  <option key={f.value || "all"} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              <div className="admin-segmented shrink-0">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`admin-segmented-btn inline-flex items-center gap-1.5 ${view === "list" ? "admin-segmented-btn-active" : ""}`}
                  aria-pressed={view === "list"}
                >
                  <List className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView("board")}
                  className={`admin-segmented-btn inline-flex items-center gap-1.5 ${view === "board" ? "admin-segmented-btn-active" : ""}`}
                  aria-pressed={view === "board"}
                >
                  <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Board</span>
                </button>
              </div>
            </div>
          </div>

          <div className="admin-segmented max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setSection("")}
              className={`admin-segmented-btn whitespace-nowrap ${section === "" ? "admin-segmented-btn-active" : ""}`}
            >
              All areas
              {counts?.sections && (
                <span className="ml-1.5 tabular-nums opacity-70">
                  {Object.values(counts.sections).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
            {TASK_SECTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSection(s.value)}
                className={`admin-segmented-btn whitespace-nowrap ${section === s.value ? "admin-segmented-btn-active" : ""}`}
              >
                {s.label}
                {counts?.sections?.[s.value] != null && (
                  <span className="ml-1.5 tabular-nums opacity-70">{counts.sections[s.value]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/5 px-4 py-4 text-sm text-red-200 sm:px-5">
            {error}
            <button type="button" onClick={() => void load()} className="mt-2 block text-neon hover:underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-4 sm:p-5">
            <AdminSkeleton rows={6} />
          </div>
        ) : view === "list" ? (
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th className="min-w-[14rem]">Task</th>
                  {showSectionColumn && <th className="hidden md:table-cell">Area</th>}
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Priority</th>
                  <th className="hidden lg:table-cell">Assignee</th>
                  <th className="hidden sm:table-cell">Due</th>
                  <th className="w-10" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                <InlineAddTaskRow
                  placeholder="Add a task… press Enter"
                  sectionFilter={section}
                  assignToMe={assigneeFilter === "me"}
                  userId={user.id}
                  onCreated={handleInlineCreated}
                  autoFocus={tasks.length === 0}
                  colSpan={tableColSpan}
                  inputRef={listAddRef}
                />
                {tasks.map((task) => (
                  <TaskListRow
                    key={task.id}
                    task={task}
                    team={team}
                    user={user}
                    isAdmin={isAdmin}
                    showSectionColumn={showSectionColumn}
                    expanded={expandedIds.has(task.id)}
                    onToggleExpand={() => toggleExpanded(task.id)}
                    onPatch={patchTask}
                    onStatusChange={handleStatusChange}
                    onDelete={deleteTask}
                    statusBusy={affiliateResolving}
                    colSpan={tableColSpan}
                  />
                ))}
                {tasks.length > 0 && (
                  <InlineAddTaskRow
                    placeholder="Add another task…"
                    sectionFilter={section}
                    assignToMe={assigneeFilter === "me"}
                    userId={user.id}
                    onCreated={handleInlineCreated}
                    colSpan={tableColSpan}
                  />
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            {TASK_STATUSES.map((col) => (
              <section
                key={col.value}
                className="flex min-h-[16rem] flex-col rounded-lg border border-dark-border bg-dark/30"
              >
                <header className="border-b border-dark-border px-3 py-2.5">
                  <h2 className="text-sm font-medium text-white">{col.label}</h2>
                  <p className="text-xs text-muted">
                    {counts?.[col.value] ?? tasksByStatus[col.value].length} tasks
                  </p>
                </header>
                <div className="flex flex-1 flex-col gap-3 p-3">
                  {tasksByStatus[col.value].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isAdmin={isAdmin}
                      onPatch={patchTask}
                      onStatusChange={handleStatusChange}
                      onDelete={deleteTask}
                      statusBusy={affiliateResolving}
                    />
                  ))}
                  <div className="mt-auto flex items-center gap-2 rounded-lg border border-dashed border-dark-border px-2 py-1.5">
                    <Plus className="h-3.5 w-3.5 shrink-0 text-muted-dim" />
                    <BoardInlineAdd
                      placeholder={`Add to ${col.label.toLowerCase()}…`}
                      sectionFilter={section}
                      status={col.value}
                      assignToMe={assigneeFilter === "me"}
                      userId={user.id}
                      onCreated={handleInlineCreated}
                    />
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {affiliateDonePrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => !affiliateDoneSaving && setAffiliateDonePrompt(null)}
        >
          <div
            className="admin-card w-full max-w-md admin-card-pad"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
            aria-labelledby="affiliate-signup-done-title"
          >
            <h3 id="affiliate-signup-done-title" className="admin-section-title">
              Update affiliate status
            </h3>
            <p className="mt-2 text-sm text-muted">
              Marking <span className="text-white">{affiliateDonePrompt.task.title}</span> as done.
              What is the affiliate program status?
            </p>
            <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-muted-dim">
              CRM status
            </label>
            <select
              value={affiliateOutcomeStatus}
              onChange={(e) =>
                setAffiliateOutcomeStatus(e.target.value as AffiliateSignupOutcomeStatus)
              }
              className={`${inputClass} mt-1.5`}
              disabled={affiliateDoneSaving}
            >
              {AFFILIATE_SIGNUP_OUTCOME_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => void completeAffiliateSignupTask()}
                disabled={affiliateDoneSaving}
                className="admin-btn-primary disabled:opacity-50"
              >
                {affiliateDoneSaving ? "Saving…" : "Complete task"}
              </button>
              <button
                type="button"
                onClick={() => setAffiliateDonePrompt(null)}
                disabled={affiliateDoneSaving}
                className="admin-toolbar-btn disabled:opacity-50"
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

function BoardInlineAdd({
  placeholder,
  sectionFilter,
  status,
  assignToMe,
  userId,
  onCreated,
}: {
  placeholder: string;
  sectionFilter: TaskSection | "";
  status: TaskStatus;
  assignToMe: boolean;
  userId: string;
  onCreated: (task: AdminTask) => void;
}) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const title = value.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          section: defaultSection(sectionFilter),
          status,
          assignedToId: assignToMe ? userId : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to add task");
      setValue("");
      onCreated(data.task as AdminTask);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add task", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <input
      type="text"
      value={value}
      disabled={saving}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void submit();
        }
      }}
      placeholder={placeholder}
      className={`${inlineCellInputClass} text-xs placeholder:italic`}
    />
  );
}
