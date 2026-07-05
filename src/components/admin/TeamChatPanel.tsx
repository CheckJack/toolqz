"use client";

import { ChevronLeft, Search, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type ListFilter = "all" | "unread";

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

function previewText(lastMessage: ChatMember["lastMessage"], currentUserId: string) {
  if (!lastMessage) return "Start a conversation";
  const prefix = lastMessage.senderId === currentUserId ? "You: " : "";
  const body = lastMessage.body.replace(/\s+/g, " ").trim();
  const preview = body.length > 48 ? `${body.slice(0, 48)}…` : body;
  return prefix + preview;
}

export function TeamChatPanel({
  currentUserId,
  variant,
  initialWithUserId,
  onSelectUser,
  onUnreadChange,
}: {
  currentUserId: string;
  variant: "widget" | "page";
  initialWithUserId?: string | null;
  onSelectUser?: (userId: string | null) => void;
  onUnreadChange?: (count: number) => void;
}) {
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialWithUserId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedMember = members.find((m) => m.id === selectedUserId) ?? null;
  const isPage = variant === "page";
  const unreadMembers = members.filter((m) => m.unreadCount > 0).length;

  const filteredMembers = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return members.filter((m) => {
      if (listFilter === "unread" && m.unreadCount === 0) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    });
  }, [members, listFilter, searchInput]);

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

  const selectUser = useCallback(
    (userId: string | null) => {
      setSelectedUserId(userId);
      onSelectUser?.(userId);
    },
    [onSelectUser]
  );

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

  const sidebarWidth = isPage ? "w-full sm:w-72 lg:w-80" : "w-36 sm:w-44";
  const heightClass = isPage ? "min-h-0 flex-1" : "h-full";
  const mobileStack = isPage;
  const hideMemberList = mobileStack && Boolean(selectedUserId);
  const hideThread = mobileStack && !selectedUserId;

  return (
    <div className={`flex min-h-0 overflow-hidden bg-dark-elevated ${heightClass}`}>
      <aside
        className={`flex min-h-0 shrink-0 flex-col border-r border-dark-border bg-dark/40 ${sidebarWidth} ${
          hideMemberList ? "max-lg:hidden" : mobileStack ? "max-lg:w-full max-lg:border-r-0" : ""
        }`}
      >
        <div className="space-y-3 border-b border-dark-border p-3 sm:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-dim">
            Team
          </p>
          {isPage && (
            <div className="admin-segmented w-full">
              <button
                type="button"
                onClick={() => setListFilter("all")}
                className={`admin-segmented-btn flex-1 ${listFilter === "all" ? "admin-segmented-btn-active" : ""}`}
              >
                All
                <span className="ml-1 tabular-nums opacity-70">{members.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setListFilter("unread")}
                className={`admin-segmented-btn flex-1 ${listFilter === "unread" ? "admin-segmented-btn-active" : ""}`}
              >
                Unread
                {unreadMembers > 0 && (
                  <span className="ml-1 tabular-nums opacity-70">{unreadMembers}</span>
                )}
              </button>
            </div>
          )}
          {isPage && (
            <div className="relative min-w-0">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim"
                strokeWidth={1.75}
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search team…"
                className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingMembers && members.length === 0 ? (
            <p className="p-4 text-sm text-muted">Loading team…</p>
          ) : filteredMembers.length === 0 ? (
            <p className="p-4 text-sm text-muted">
              {searchInput || listFilter === "unread"
                ? "No teammates match your filters."
                : "No other team members yet."}
            </p>
          ) : (
            filteredMembers.map((m) => {
              const active = m.id === selectedUserId;
              const activityTime = m.lastMessage?.createdAt ?? m.lastActivityAt;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectUser(m.id)}
                  className={`flex w-full items-start gap-3 border-b border-dark-border/40 px-3 py-3 text-left transition-colors hover:bg-dark-border/20 sm:px-4 ${
                    active ? "bg-neon/10" : ""
                  }`}
                >
                  <span
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      active ? "bg-neon text-ink" : "bg-dark-border text-white"
                    }`}
                  >
                    {initials(m.name)}
                    {m.unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-neon ring-2 ring-dark" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm font-medium ${active ? "text-neon" : "text-white"}`}
                      >
                        {m.name}
                      </span>
                      {activityTime && (
                        <span className="shrink-0 text-[10px] text-muted-dim">
                          {formatTime(activityTime)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] text-muted">
                        {previewText(m.lastMessage, currentUserId)}
                      </span>
                      {m.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-neon px-1.5 py-0.5 text-[10px] font-bold text-ink">
                          {m.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col ${hideThread ? "max-lg:hidden" : ""}`}
      >
        {!selectedMember ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-medium text-white">Select a conversation</p>
            <p className="max-w-xs text-[13px] text-muted">
              {isPage
                ? "Choose a teammate from the list to start or continue a chat."
                : "Pick a teammate on the left to start a chat."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-2 border-b border-dark-border/60 bg-dark/20 px-3 py-2.5 sm:gap-3 sm:px-4">
              {mobileStack && (
                <button
                  type="button"
                  onClick={() => selectUser(null)}
                  className="admin-icon-btn h-9 w-9 shrink-0 lg:hidden"
                  aria-label="Back to team list"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
                </button>
              )}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon/15 text-sm font-semibold text-neon">
                {initials(selectedMember.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{selectedMember.name}</p>
                <p className="truncate text-[11px] text-muted-dim">{selectedMember.email}</p>
              </div>
              {isPage && (
                <p className="hidden text-[11px] text-muted-dim sm:block">
                  Enter send · Shift+Enter new line
                </p>
              )}
            </div>

            <div
              ref={threadRef}
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 ${
                isPage ? "bg-dark/20" : ""
              }`}
            >
              <div className="mx-auto w-full max-w-3xl space-y-3">
                {loadingThread && messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">
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
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                            mine
                              ? "rounded-br-md bg-neon text-ink"
                              : "rounded-bl-md border border-dark-border bg-dark-elevated text-white"
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
            </div>

            {error && <p className="px-4 pb-1 text-xs text-red-400">{error}</p>}

            <form
              onSubmit={handleSend}
              className={`shrink-0 border-t border-dark-border/60 px-3 pb-3 pt-2 sm:px-5 ${
                isPage ? "bg-dark-elevated/60" : "p-3"
              }`}
            >
              <div className="mx-auto w-full max-w-3xl">
                <div className="flex items-end gap-2 rounded-2xl border border-dark-border bg-dark p-1.5 shadow-inner focus-within:border-neon/40 focus-within:ring-1 focus-within:ring-neon/20">
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    rows={1}
                    placeholder={`Message ${selectedMember.name.split(" ")[0]}…`}
                    className="max-h-32 min-h-[2.5rem] min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-5 text-white placeholder:text-muted focus:outline-none focus:ring-0"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon text-ink transition hover:bg-neon-dim disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                {!isPage && (
                  <p className="mt-1.5 text-center text-[10px] text-muted">
                    Enter to send · Shift+Enter for a new line
                  </p>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
