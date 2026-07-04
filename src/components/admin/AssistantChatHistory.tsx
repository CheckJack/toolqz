"use client";

import { useCallback, useEffect, useState } from "react";
import { History, X } from "lucide-react";

export interface ChatSessionItem {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentSessionId: string | null;
  onSelectSession: (sessionId: string, messages: LoadedChatMessage[]) => void;
}

export interface LoadedChatMessage {
  role: "user" | "assistant";
  content: string;
  links?: { label: string; href: string }[];
  cards?: unknown[];
}

export function AssistantChatHistory({
  open,
  onClose,
  currentSessionId,
  onSelectSession,
}: Props) {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const loadList = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/agent/chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sessions) setSessions(data.sessions);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  async function openSession(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/agent/chat?sessionId=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json();
      onSelectSession(id, data.messages ?? []);
      onClose();
    } finally {
      setLoadingId(null);
    }
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-dark-elevated">
      <div className="flex items-center justify-between border-b border-dark-border px-3 py-2.5">
        <div className="flex items-center gap-2 text-[13px] font-medium text-white">
          <History className="h-4 w-4 text-muted" strokeWidth={1.75} />
          Past chats
        </div>
        <button type="button" onClick={onClose} className="admin-icon-btn h-8 w-8" aria-label="Close history">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && sessions.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted">No saved chats yet.</p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((s) => {
              const active = s.id === currentSessionId;
              const label = s.title || "Untitled chat";
              const when = new Date(s.updatedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={loadingId === s.id}
                    onClick={() => void openSession(s.id)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-neon/40 bg-neon/5"
                        : "border-dark-border bg-dark hover:border-border-hover"
                    }`}
                  >
                    <p className="truncate text-[13px] text-white">{label}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{when}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
