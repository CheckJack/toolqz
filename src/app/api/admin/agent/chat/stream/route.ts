import { NextRequest } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { encodeSseEvent } from "@/lib/agent/chat-events";
import { runAgentChatWithEvents } from "@/lib/agent/chat";
import { saveChatTurn } from "@/lib/agent/chat-sessions";
import type { ChatTurn } from "@/lib/agent/gemini-chat";
import { getGeminiConfig } from "@/lib/agent/gemini";
import { requireSession } from "@/lib/auth";

const MAX_MESSAGES = 24;
const MAX_CONTENT_LENGTH = 4000;

function parseHistory(body: unknown): ChatTurn[] {
  if (!body || typeof body !== "object" || !("messages" in body)) return [];
  const raw = (body as { messages: unknown }).messages;
  if (!Array.isArray(raw)) return [];

  const turns: ChatTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: string }).role;
    const content = String((item as { content?: string }).content ?? "").trim();
    if (!content || content.length > MAX_CONTENT_LENGTH) continue;
    if (role === "user" || role === "assistant") {
      turns.push({ role, content });
    }
  }

  return turns.slice(-MAX_MESSAGES);
}

function parsePageContext(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("pageContext" in body)) return undefined;
  const ctx = String((body as { pageContext?: string }).pageContext ?? "").trim();
  return ctx.slice(0, 500) || undefined;
}

function parseSessionId(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("sessionId" in body)) return null;
  const id = String((body as { sessionId?: string }).sessionId ?? "").trim();
  return id || null;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const session = await requireSession();
    const { configured, enabled } = getGeminiConfig();

    if (!enabled) {
      return new Response(JSON.stringify({ error: "Admin agent is disabled" }), { status: 503 });
    }
    if (!configured) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server" }), {
        status: 503,
      });
    }

    const body = await request.json();
    const history = parseHistory(body);
    const last = history[history.length - 1];

    if (!last || last.role !== "user") {
      return new Response(JSON.stringify({ error: "Send a messages array ending with a user message" }), {
        status: 400,
      });
    }

    const pageContext = parsePageContext(body);
    const existingSessionId = parseSessionId(body);

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: Parameters<typeof encodeSseEvent>[0]) => {
          controller.enqueue(encoder.encode(encodeSseEvent(event)));
        };

        try {
          const result = await runAgentChatWithEvents(
            history,
            { userId: session.id, role: session.role },
            { pageContext, role: session.role },
            send,
            request.signal
          );

          let sessionId = existingSessionId;
          try {
            sessionId = await saveChatTurn(session.id, existingSessionId, last.content, {
              reply: result.reply,
              links: result.links,
              cards: result.cards,
            });
          } catch (error) {
            console.error("[admin/agent/chat/stream] session save failed", error);
          }

          const { lastTool, ...payload } = result;
          void lastTool;
          send({ type: "done", result: { ...payload, sessionId: sessionId ?? undefined } });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            send({ type: "error", message: "Stopped" });
          } else {
            const message = error instanceof Error ? error.message : "Agent chat failed";
            send({ type: "error", message });
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handleAuthError(error, "Agent chat stream failed");
  }
}
