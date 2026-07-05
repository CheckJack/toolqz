"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, History, MessageSquare, Square, Trash2, Volume2 } from "lucide-react";
import { ASSISTANT_QUICK_PROMPTS } from "@/lib/assistant-ui";
import {
  AssistantChatHistory,
  type LoadedChatMessage,
} from "@/components/admin/AssistantChatHistory";
import { AssistantMessageBody } from "@/components/admin/AssistantMessageBody";
import type { AssistantCard } from "@/lib/agent/assistant-cards";
import type { FollowUpPrompt } from "@/lib/agent/definitions";
import {
  clearStoredAssistantChat,
  loadStoredAssistantChat,
  saveStoredAssistantChat,
} from "@/lib/assistant-chat-storage";
import { streamAssistantChat } from "@/lib/assistant-stream-client";
import { useAssistantPageContext } from "@/hooks/use-assistant-page-context";
import {
  speakText,
  stopSpeaking,
  useSpeechRecognition,
} from "@/hooks/use-speech-recognition";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  links?: { label: string; href: string }[];
  cards?: AssistantCard[];
  followUps?: FollowUpPrompt[];
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const WELCOME: AssistantMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I'm your TOOLQZ assistant. I can create tools from URLs, manage affiliates, check analytics, publish or delete listings (with your confirmation), and more. Tap the mic to talk, or type below.",
};

const QUICK_PROMPTS = ASSISTANT_QUICK_PROMPTS;

interface Props {
  variant?: "widget" | "page";
  className?: string;
  persistKey?: "widget" | "page";
  onRequestClose?: () => void;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      <span className="h-2 w-2 animate-bounce rounded-full bg-neon/80 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-neon/80 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-neon/80 [animation-delay:300ms]" />
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dark-border bg-dark text-muted">
      <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
    </div>
  );
}

export function AdminAssistantChat({
  variant = "page",
  className = "",
  persistKey,
  onRequestClose,
}: Props) {
  const pathname = usePathname();
  const pageContext = useAssistantPageContext(pathname);
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const storageReadyRef = useRef(!persistKey);
  const [input, setInput] = useState("");
  const [queuedMessages, setQueuedMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState("Thinking…");
  const [error, setError] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const queueRef = useRef<string[]>([]);
  const drainQueueRef = useRef<(() => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    isSupported,
    isListening,
    isRequestingMic,
    liveTranscript,
    speechError,
    startListening,
    stopListening,
    consumeTranscript,
    clearSpeechError,
  } = useSpeechRecognition();

  useEffect(() => {
    fetch("/api/admin/agent")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setReady(Boolean(data.configured && data.enabled));
      })
      .catch(() => setReady(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, liveTranscript]);

  useEffect(() => {
    if (speechError) setError(speechError);
  }, [speechError]);

  useEffect(() => {
    if (!persistKey) return;
    const stored = loadStoredAssistantChat();
    if (stored?.messages?.length) setMessages(stored.messages);
    if (stored?.sessionId) setSessionId(stored.sessionId);
    storageReadyRef.current = true;
  }, [persistKey]);

  useEffect(() => {
    if (!persistKey || !storageReadyRef.current) return;
    saveStoredAssistantChat({ sessionId, messages });
  }, [persistKey, sessionId, messages]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (historyOpen) {
          setHistoryOpen(false);
          return;
        }
        if (onRequestClose) onRequestClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen, onRequestClose]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setLoadingHint("Stopped");
  }, []);

  const runSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      stopSpeaking();
      setError("");
      const userMsg: AssistantMessage = { id: newId(), role: "user", content: trimmed };
      const nextMessages = [...messagesRef.current, userMsg];
      setMessages(nextMessages);
      setLoading(true);
      setLoadingHint("Thinking…");

      const streamMsgId = newId();
      let streamContent = "";
      let streamStarted = false;

      abortRef.current = new AbortController();

      try {
        await streamAssistantChat({
          messages: nextMessages
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
          pageContext,
          sessionId: sessionIdRef.current,
          signal: abortRef.current.signal,
          onEvent: (event) => {
            if (event.type === "tool_start") {
              setLoadingHint(event.label);
            }
            if (event.type === "text_delta") {
              streamContent += event.delta;
              if (!streamStarted) {
                streamStarted = true;
                setLoading(false);
                setMessages((prev) => [
                  ...prev,
                  { id: streamMsgId, role: "assistant", content: streamContent },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId ? { ...m, content: streamContent } : m
                  )
                );
              }
            }
            if (event.type === "done") {
              const { result } = event;
              const finalMsg: AssistantMessage = {
                id: streamStarted ? streamMsgId : newId(),
                role: "assistant",
                content: result.reply,
                links: result.links,
                cards: result.cards,
                followUps: result.followUps,
              };
              setMessages((prev) => {
                if (streamStarted) {
                  return prev.map((m) => (m.id === streamMsgId ? finalMsg : m));
                }
                return [...prev, finalMsg];
              });
              if (result.sessionId) setSessionId(result.sessionId);
              if (speakReplies) speakText(result.reply);
            }
            if (event.type === "error") {
              if (event.message === "Stopped") return;
              throw new Error(event.message);
            }
          },
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          if (streamStarted && streamContent) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamMsgId ? { ...m, content: `${streamContent}\n\n_(stopped)_` } : m
              )
            );
          }
          return;
        }
        const msg = err instanceof Error ? err.message : "Assistant request failed";
        setError(msg);
        if (!streamStarted) {
          setMessages((prev) => [
            ...prev,
            { id: newId(), role: "assistant", content: `Sorry — ${msg}` },
          ]);
        }
      } finally {
        abortRef.current = null;
        setLoading(false);
        inputRef.current?.focus();
        queueMicrotask(() => drainQueueRef.current?.());
      }
    },
    [pageContext, speakReplies]
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || ready === false) return;

      if (loadingRef.current) {
        queueRef.current.push(trimmed);
        setQueuedMessages([...queueRef.current]);
        return;
      }

      void runSend(trimmed);
    },
    [ready, runSend]
  );

  drainQueueRef.current = () => {
    if (loadingRef.current || queueRef.current.length === 0) return;
    const next = queueRef.current.shift();
    setQueuedMessages([...queueRef.current]);
    if (next) void runSend(next);
  };

  const sendFromComposer = useCallback(
    (text: string) => {
      send(text);
      setInput("");
    },
    [send]
  );

  async function toggleMic() {
    clearSpeechError();
    setError("");
    if (isListening) {
      stopListening();
      const spoken = consumeTranscript();
      if (spoken) {
        setInput((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
      }
      inputRef.current?.focus();
      return;
    }
    await startListening();
  }

  function clearChat() {
    stopGeneration();
    stopSpeaking();
    stopListening();
    consumeTranscript();
    clearSpeechError();
    queueRef.current = [];
    setQueuedMessages([]);
    setMessages([WELCOME]);
    setSessionId(null);
    setInput("");
    setError("");
    setHistoryOpen(false);
    if (persistKey) clearStoredAssistantChat();
  }

  function removeQueuedMessage(index: number) {
    queueRef.current = queueRef.current.filter((_, i) => i !== index);
    setQueuedMessages([...queueRef.current]);
  }

  function editUserMessage(id: string) {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx < 0 || messages[idx].role !== "user") return;
    setInput(messages[idx].content);
    setMessages(messages.slice(0, idx));
    setSessionId(null);
    inputRef.current?.focus();
  }

  async function copyMessage(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  function restoreSession(id: string, loaded: LoadedChatMessage[]) {
    setSessionId(id);
    setMessages([
      WELCOME,
      ...loaded.map((m) => ({
        id: newId(),
        role: m.role,
        content: m.content,
        links: m.links,
        cards: m.cards as AssistantCard[] | undefined,
      })),
    ]);
    setHistoryOpen(false);
  }

  const composerValue = isListening
    ? [input, liveTranscript].filter(Boolean).join(input && liveTranscript ? " " : "")
    : input;
  const canSend =
    ready !== false && !isListening && !isRequestingMic && composerValue.trim().length > 0;
  const micBusy = isListening || isRequestingMic;
  const isWidget = variant === "widget";
  const showQuickPrompts = !messages.some((m) => m.role === "user");
  const showComposerPrompts = showQuickPrompts && isWidget;
  const showEmptyStatePrompts = showQuickPrompts && !isWidget;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) {
      stopGeneration();
      return;
    }
    if (canSend) sendFromComposer(composerValue);
  }

  return (
    <div className={`relative flex min-h-0 flex-col ${className}`}>
      {ready === false && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
          Set <code>GEMINI_API_KEY</code> on the server to enable the assistant.
        </div>
      )}

      <AssistantChatHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        currentSessionId={sessionId}
        onSelectSession={restoreSession}
      />

      <div
        className={`flex items-center gap-3 border-b border-dark-border/60 px-3 py-2 sm:px-4 ${
          isWidget ? "justify-end" : "justify-between"
        }`}
      >
        {!isWidget && (
          <p className="hidden text-[11px] text-muted-dim sm:block">
            Enter to send · Shift+Enter new line · ⌘K focus
          </p>
        )}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className={`admin-icon-btn h-8 w-8 ${
              historyOpen ? "border-neon/50 bg-neon/10 text-neon" : ""
            }`}
            title="Past chats"
            aria-label="Past chats"
          >
            <History className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSpeakReplies((v) => !v);
              if (speakReplies) stopSpeaking();
            }}
            className={`admin-icon-btn h-8 w-8 ${
              speakReplies ? "border-neon/50 bg-neon/10 text-neon" : ""
            }`}
            title={speakReplies ? "Mute spoken replies" : "Read replies aloud"}
            aria-label={speakReplies ? "Mute spoken replies" : "Read replies aloud"}
          >
            <Volume2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={clearChat}
            disabled={loading}
            className="admin-icon-btn h-8 w-8 disabled:opacity-50"
            title="Start new chat"
            aria-label="Start new chat"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 ${
          isWidget ? "" : "bg-dark/20"
        }`}
      >
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "assistant" && <AssistantAvatar />}
              <div
                className={`group max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-neon text-ink"
                    : "border border-dark-border bg-dark-elevated text-white"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap text-[13px]">{msg.content}</p>
                ) : (
                  <AssistantMessageBody
                    content={msg.content}
                    cards={msg.cards}
                    onPrompt={(text) => send(text)}
                  />
                )}
                {msg.links && msg.links.length > 0 && (
                  <div className="mt-2.5 flex flex-col gap-1.5 border-t border-dark-border/50 pt-2.5">
                    {msg.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="inline-flex items-center gap-1 rounded-lg border border-neon/30 bg-neon/5 px-2.5 py-1.5 text-xs font-medium text-neon hover:bg-neon/10"
                      >
                        {link.label}
                        <span aria-hidden>→</span>
                      </Link>
                    ))}
                  </div>
                )}
                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-dark-border/50 pt-2.5">
                    {msg.followUps.map((chip) => (
                      <button
                        key={chip.text}
                        type="button"
                        onClick={() => send(chip.text)}
                        className="rounded-full border border-dark-border bg-dark px-2.5 py-0.5 text-[11px] text-muted transition hover:border-neon/40 hover:text-neon"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
                <div
                  className={`mt-2 flex gap-2 text-[11px] ${
                    msg.role === "user" ? "justify-end text-ink/70" : "text-muted"
                  } opacity-0 transition group-hover:opacity-100`}
                >
                  {msg.role === "user" && msg.id !== "welcome" && (
                    <>
                      <button
                        type="button"
                        onClick={() => void copyMessage(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 hover:underline"
                        aria-label={copiedId === msg.id ? "Copied" : "Copy message"}
                        title={copiedId === msg.id ? "Copied" : "Copy"}
                      >
                        <Copy className="h-3 w-3" strokeWidth={2} />
                        {copiedId === msg.id ? "Copied" : "Copy"}
                      </button>
                      <button type="button" onClick={() => editUserMessage(msg.id)} className="hover:underline">
                        Edit
                      </button>
                    </>
                  )}
                  {msg.role === "assistant" && msg.id !== "welcome" && (
                    <>
                      <button
                        type="button"
                        onClick={() => void copyMessage(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 hover:text-neon"
                        aria-label={copiedId === msg.id ? "Copied" : "Copy message"}
                        title={copiedId === msg.id ? "Copied" : "Copy"}
                      >
                        <Copy className="h-3 w-3" strokeWidth={2} />
                        {copiedId === msg.id ? "Copied" : "Copy"}
                      </button>
                      <button type="button" onClick={() => speakText(msg.content)} className="hover:text-neon">
                        Listen
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <AssistantAvatar />
              <div className="rounded-2xl border border-dark-border bg-dark-elevated px-3.5 py-2.5">
                <p className="mb-1 text-xs text-muted">{loadingHint}</p>
                <TypingIndicator />
              </div>
            </div>
          )}
          {showEmptyStatePrompts && (
            <div className="pt-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-dim">
                Try asking
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.text}
                    type="button"
                    disabled={ready === false}
                    onClick={() => sendFromComposer(p.text)}
                    className="admin-toolbar-btn disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {micBusy && (
            <div className="flex justify-center">
              <span className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                {isRequestingMic ? "Allow microphone when prompted…" : "Listening… tap mic when done"}
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className={`shrink-0 border-t border-dark-border/60 px-3 pb-3 pt-2 sm:px-5 ${
          isWidget
            ? "bg-dark-elevated max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            : "bg-dark-elevated/60"
        }`}
      >
        {queuedMessages.length > 0 && (
          <div className="mb-2 space-y-1.5">
            <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted">
              Queued — sends when ready
            </p>
            {queuedMessages.map((msg, index) => (
              <div
                key={`${index}-${msg.slice(0, 24)}`}
                className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2.5 py-2"
              >
                <p className="min-w-0 flex-1 text-[12px] leading-snug text-amber-100/90">{msg}</p>
                <button
                  type="button"
                  onClick={() => removeQueuedMessage(index)}
                  className="shrink-0 text-[11px] text-muted hover:text-white"
                  aria-label="Remove queued message"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {showComposerPrompts && (
          <div className="mb-2 flex flex-wrap justify-center gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.text}
                type="button"
                disabled={ready === false}
                onClick={() => sendFromComposer(p.text)}
                className="rounded-full border border-dark-border bg-dark px-2.5 py-1 text-[11px] text-muted transition hover:border-neon/40 hover:text-neon disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-1.5 rounded-2xl border border-dark-border bg-dark p-1.5 shadow-inner focus-within:border-neon/40 focus-within:ring-1 focus-within:ring-neon/20">
          <button
            type="button"
            onClick={() => void toggleMic()}
            disabled={ready === false || !isSupported || isRequestingMic}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
              isListening
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : isRequestingMic
                  ? "bg-amber-500/15 text-amber-300"
                  : "text-muted hover:bg-dark-elevated hover:text-neon"
            } disabled:opacity-40`}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            value={composerValue}
            onChange={(e) => {
              if (!isListening) setInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (loading) stopGeneration();
                else if (canSend) sendFromComposer(composerValue);
              }
            }}
            rows={1}
            readOnly={micBusy}
            disabled={ready === false}
            placeholder={
              isRequestingMic
                ? "Allow microphone access in the browser prompt…"
                : isListening
                  ? "Listening… tap mic when done, then Send"
                  : loading
                    ? "Type to queue"
                    : "Message Assistant"
            }
            className={`max-h-28 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-sm leading-5 text-white placeholder:text-muted focus:outline-none focus:ring-0 disabled:opacity-50 ${
              micBusy ? "cursor-default" : ""
            }`}
          />
          {loading ? (
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
              aria-label="Stop generating"
              title="Stop"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon text-ink transition hover:bg-neon-dim disabled:opacity-40"
              aria-label="Send message"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
          </div>
        </div>
        {isWidget && (
          <p className="mt-2 text-center text-[10px] leading-relaxed text-muted">
            {loading
              ? "Stop · or queue another message with Enter"
              : "Enter send · Shift+Enter new line · Esc close · ⌘K focus"}
          </p>
        )}
      </form>

      {(error || speechError) && !loading && (
        <div className={`text-xs text-red-400 ${isWidget ? "px-3 pb-2" : "mt-1 px-1"}`}>
          <p>{error || speechError}</p>
        </div>
      )}
    </div>
  );
}
