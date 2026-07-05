import type { AgentChatResult } from "@/lib/agent/definitions";
import type { AgentStreamEvent } from "@/lib/agent/chat-events";

export interface StreamChatOptions {
  messages: { role: "user" | "assistant"; content: string }[];
  pageContext?: string;
  sessionId?: string | null;
  confirmToken?: string | null;
  signal?: AbortSignal;
  onEvent: (event: AgentStreamEvent) => void;
}

export async function streamAssistantChat(options: StreamChatOptions): Promise<void> {
  const res = await fetch("/api/admin/agent/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: options.messages,
      pageContext: options.pageContext,
      sessionId: options.sessionId,
      confirmToken: options.confirmToken,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Assistant request failed");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Stream unavailable");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let eventType = "message";
      let dataLine = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
        if (line.startsWith("data: ")) dataLine = line.slice(6);
      }

      if (!dataLine) continue;

      try {
        const raw = JSON.parse(dataLine) as Record<string, unknown>;
        if (!raw.type) raw.type = eventType;
        options.onEvent(raw as AgentStreamEvent);
      } catch {
        /* ignore */
      }
    }
  }
}

export type { AgentChatResult };
