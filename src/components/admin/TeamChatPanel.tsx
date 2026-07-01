"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ChatMember {
  id: string;
  name: string;
  email: string;
  role: string;
  conversationId: string | null;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  lastActivityAt: string | null;
}

export interface ChatMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function previewText(
  lastMessage: ChatMember["lastMessage"],
  currentUserId: string
) {
  if (!lastMessage) return "Start a conversation";
  const prefix = lastMessage.senderId === currentUserId ? "You: " : "";
  const body = lastMessage.body.replace(/\s+/g, " ").trim();
  const preview = body.length > 40 ? `${body.slice(0, 40)}…` : body;
  return prefix + preview;
}

export function TeamChatPanel({
  currentUserId,
  variant,
  initialWithUserId,
  onUnreadChange,
}: {
  currentUserId: string;
  variant: "widget" | "page";
  initialWithUserId?: string | null;
  onUnreadChange?: (count: number) => void;
}) {
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialWithUserId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedMember = members.find((m) => m.id === selectedUserId) ?? null;

  const scrollThreadToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const resizeComposer = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/messages");
      if (!res.ok) return;
      const data = await res.json();
      setMembers(data.members ?? []);
      onUnreadChange?.(data.unreadTotal ?? 0);
      window.dispatchEvent(new CustomEvent("admin:messages-updated"));
    } finally {
      setLoadingMembers(false);
    }
  }, [onUnreadChange]);

  const loadThread = useCallback(
    async (userId: string, silent = false) => {
      if (!silent) setLoadingThread(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/messages?withUserId=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Could not load conversation");
          return;
        }
        const data = await res.json();
        setMessages(data.messages ?? []);
        setConversationId(data.conversation?.id ?? null);
        await loadMembers();
      } finally {
        if (!silent) setLoadingThread(false);
      }
    },
    [loadMembers]
  );

  useEffect(() => {
    loadMembers();
    const interval = setInterval(loadMembers, 15000);
    return () => clearInterval(interval);
  }, [loadMembers]);

  useEffect(() => {
    if (initialWithUserId) setSelectedUserId(initialWithUserId);
  }, [initialWithUserId]);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      setConversationId(null);
      return;
    }
    loadThread(selectedUserId);
    const interval = setInterval(() => loadThread(selectedUserId, true), 8000);
    return () => clearInterval(interval);
  }, [selectedUserId, loadThread]);

  useEffect(() => {
    scrollThreadToBottom(messages.length > 0 ? "smooth" : "auto");
  }, [messages, selectedUserId, scrollThreadToBottom]);

  useEffect(() => {
    resizeComposer();
  }, [draft, resizeComposer, selectedUserId]);

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (draft.trim() && !sending) {
        void handleSend();
      }
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !selectedUserId || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: selectedUserId,
          conversationId: conversationId ?? undefined,
          body: text,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not send message");
        return;
      }
      const data = await res.json();
      setDraft("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      await loadMembers();
      requestAnimationFrame(() => scrollThreadToBottom());
    } finally {
      setSending(false);
    }
  }

  const sidebarWidth = variant === "page" ? "w-56 sm:w-64" : "w-36 sm:w-44";
  const heightClass =
    variant === "page" ? "min-h-[calc(100vh-10rem)] h-[calc(100vh-10rem)]" : "h-full";

  return (
    <div
      className={`flex overflow-hidden bg-dark-elevated ${heightClass} ${
        variant === "page" ? "rounded-2xl border border-dark-border shadow-sm" : ""
      }`}
    >
      <aside
        className={`flex min-h-0 shrink-0 flex-col border-r border-dark-border bg-dark ${sidebarWidth}`}
      >
        <div className="border-b border-dark-border px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Team</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingMembers && members.length === 0 ? (
            <p className="p-3 text-xs text-muted">Loading…</p>
          ) : members.length === 0 ? (
            <p className="p-3 text-xs text-muted">No other team members yet.</p>
          ) : (
            members.map((m) => {
              const active = m.id === selectedUserId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedUserId(m.id)}
                  className={`flex w-full items-start gap-2 border-b border-dark-border/40 px-3 py-2.5 text-left transition-colors hover:bg-dark-border/30 ${
                    active ? "bg-neon/10" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      active ? "bg-neon text-ink" : "bg-dark-border text-white"
                    }`}
                  >
                    {initials(m.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-1">
                      <span className={`truncate text-sm font-medium ${active ? "text-neon" : "text-white"}`}>
                        {m.name}
                      </span>
                      {m.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-neon px-1.5 py-0.5 text-[10px] font-bold text-ink">
                          {m.unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">
                      {previewText(m.lastMessage, currentUserId)}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!selectedMember ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-medium text-white">Team messages</p>
            <p className="max-w-xs text-xs text-muted">
              Pick a teammate on the left to start a chat or continue where you left off.
            </p>
          </div>
        ) : (
          <>
            <div className="shrink-0 flex items-center gap-3 border-b border-dark-border px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neon/20 text-sm font-semibold text-neon">
                {initials(selectedMember.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{selectedMember.name}</p>
                <p className="truncate text-xs text-muted">{selectedMember.email}</p>
              </div>
            </div>

            <div
              ref={threadRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
            >
              {loadingThread && messages.length === 0 ? (
                <p className="text-center text-xs text-muted">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-muted">
                  No messages yet — say hello to {selectedMember.name.split(" ")[0]}.
                </p>
              ) : (
                messages.map((msg) => {
                  const mine = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? "rounded-br-md bg-neon text-ink"
                            : "rounded-bl-md border border-dark-border bg-dark text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${mine ? "text-ink/60" : "text-muted"}`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {error && (
              <p className="px-4 pb-1 text-xs text-red-400">{error}</p>
            )}

            <form onSubmit={handleSend} className="shrink-0 border-t border-dark-border p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  rows={1}
                  placeholder={`Message ${selectedMember.name.split(" ")[0]}…`}
                  className="min-h-[40px] max-h-32 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm leading-relaxed text-white placeholder:text-muted focus:border-neon/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="shrink-0 rounded-xl bg-neon px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
                >
                  Send
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted">
                Enter to send · Shift+Enter for a new line
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
