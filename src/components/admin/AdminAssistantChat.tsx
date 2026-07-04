"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { AssistantMessageBody } from "@/components/admin/AssistantMessageBody";
import type { AssistantCard } from "@/lib/agent/assistant-cards";
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

const QUICK_PROMPTS = [
  { label: "Analytics", text: "Show click analytics for the last 30 days" },
  { label: "List tools", text: "List all published tools" },
  { label: "Affiliates", text: "List affiliate programs without a tool" },
  { label: "New tool", text: "Create a tool for Notion at https://notion.so" },
];

interface Props {
  variant?: "widget" | "page";
  className?: string;
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

export function AdminAssistantChat({ variant = "page", className = "" }: Props) {
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState("Thinking…");
  const [error, setError] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const [speakReplies, setSpeakReplies] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const { isSupported, isListening, isRequestingMic, liveTranscript, speechError, startListening, stopListening, consumeTranscript, clearSpeechError } =
    useSpeechRecognition();

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

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      stopSpeaking();
      setError("");
      const userMsg: AssistantMessage = { id: newId(), role: "user", content: trimmed };
      const nextMessages = [...messagesRef.current, userMsg];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);
      setLoadingHint(
        trimmed.toLowerCase().includes("analytics") || trimmed.toLowerCase().includes("clicks")
          ? "Loading analytics…"
          : trimmed.toLowerCase().includes("affiliate")
            ? "Searching affiliates…"
            : trimmed.toLowerCase().includes("blog")
              ? "Writing blog draft…"
              : trimmed.toLowerCase().includes("delete")
                ? "Preparing delete…"
                : trimmed.toLowerCase().includes("publish")
                  ? "Checking tool…"
                  : trimmed.toLowerCase().includes("create") || trimmed.includes("http")
                    ? "Researching and drafting…"
                    : trimmed.toLowerCase().includes("update") || trimmed.toLowerCase().includes("refresh")
                      ? "Refreshing tool from website…"
                      : "Thinking…"
      );

      try {
        const res = await fetch("/api/admin/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages
              .filter((m) => m.id !== "welcome")
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Assistant request failed");
        }

        const assistantMsg: AssistantMessage = {
          id: newId(),
          role: "assistant",
          content: data.reply,
          links: data.links,
          cards: data.cards,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (speakReplies) speakText(data.reply);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Assistant request failed";
        setError(msg);
        const errMsg: AssistantMessage = {
          id: newId(),
          role: "assistant",
          content: `Sorry — ${msg}`,
        };
        setMessages((prev) => [...prev, errMsg]);
        if (speakReplies) speakText(errMsg.content);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading, speakReplies]
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

    const started = await startListening();
    if (!started) return;
  }

  function clearChat() {
    stopSpeaking();
    stopListening();
    consumeTranscript();
    clearSpeechError();
    setMessages([WELCOME]);
    setInput("");
    setError("");
  }

  const composerValue = isListening
    ? [input, liveTranscript].filter(Boolean).join(input && liveTranscript ? " " : "")
    : input;
  const canSend = !loading && ready !== false && !isListening && !isRequestingMic && composerValue.trim().length > 0;
  const micBusy = isListening || isRequestingMic;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSend) void send(composerValue);
  }

  const isWidget = variant === "widget";

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      {ready === false && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
          Set <code>GEMINI_API_KEY</code> on the server to enable the assistant.
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-b border-dark-border/60 px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.text}
              type="button"
              disabled={loading || ready === false}
              onClick={() => void send(p.text)}
              className="rounded-full border border-dark-border bg-dark px-2.5 py-0.5 text-[11px] text-muted transition hover:border-neon/40 hover:text-neon disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSpeakReplies((v) => !v);
              if (speakReplies) stopSpeaking();
            }}
            className={`rounded-lg border p-1.5 transition ${
              speakReplies
                ? "border-neon/50 bg-neon/10 text-neon"
                : "border-dark-border text-muted hover:text-white"
            }`}
            title={speakReplies ? "Mute spoken replies" : "Read replies aloud"}
            aria-label={speakReplies ? "Mute spoken replies" : "Read replies aloud"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              {!speakReplies && (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={clearChat}
            disabled={loading}
            className="rounded-lg border border-dark-border p-1.5 text-muted hover:text-white disabled:opacity-50"
            title="Clear chat"
            aria-label="Clear chat"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto px-3 py-4 ${isWidget ? "" : "rounded-xl border border-dark-border bg-dark/50"}`}
      >
        <div className="space-y-4">
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
                  <AssistantMessageBody content={msg.content} cards={msg.cards} />
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
                {msg.role === "assistant" && msg.id !== "welcome" && (
                  <button
                    type="button"
                    onClick={() => speakText(msg.content)}
                    className="mt-2 text-[11px] text-muted opacity-0 transition group-hover:opacity-100 hover:text-neon"
                  >
                    Listen
                  </button>
                )}
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
        className={`shrink-0 ${isWidget ? "border-t border-dark-border bg-dark-elevated px-3 pb-3 pt-2" : "mt-3"}`}
      >
        <div className="flex items-center gap-1.5 rounded-2xl border border-dark-border bg-dark p-1.5 shadow-inner focus-within:border-neon/40 focus-within:ring-1 focus-within:ring-neon/20">
          <button
            type="button"
            onClick={() => void toggleMic()}
            disabled={loading || ready === false || !isSupported || isRequestingMic}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
              isListening
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : isRequestingMic
                  ? "bg-amber-500/15 text-amber-300"
                  : "text-muted hover:bg-dark-elevated hover:text-neon"
            } disabled:opacity-40`}
            title={
              !isSupported
                ? "Voice not supported in this browser"
                : isRequestingMic
                  ? "Waiting for microphone permission…"
                  : isListening
                    ? "Stop listening"
                    : "Talk — tap to speak"
            }
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
                if (canSend) void send(composerValue);
              }
            }}
            rows={1}
            readOnly={micBusy}
            disabled={loading || ready === false}
            placeholder={
              isRequestingMic
                ? "Allow microphone access in the browser prompt…"
                : isListening
                  ? "Listening… tap mic when done, then Send"
                  : "Message TOOLQZ assistant…"
            }
            className={`max-h-28 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-sm leading-5 text-white placeholder:text-muted focus:outline-none focus:ring-0 disabled:opacity-50 ${
              micBusy ? "cursor-default" : ""
            }`}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon text-ink transition hover:bg-neon-dim disabled:opacity-40 disabled:hover:bg-neon"
            aria-label="Send message"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="mt-2 px-1 text-center text-[10px] leading-relaxed text-muted">
          {isSupported
            ? isListening
              ? "Speak, then tap mic to finish · review text · Send"
              : "Enter to send · Shift+Enter for new line · Mic fills the box first"
            : "Use Chrome or Edge for voice input"}
        </p>
      </form>

      {(error || speechError) && !loading && (
        <div className={`text-xs text-red-400 ${isWidget ? "px-3 pb-2" : "mt-1 px-1"}`}>
          <p>{error || speechError}</p>
          {(error || speechError)?.includes("blocked") || (error || speechError)?.includes("denied") ? (
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Chrome: address bar → Site settings → Microphone → Allow. Safari: Settings → Websites →
              Microphone. Then reload this page.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
