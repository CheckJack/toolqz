import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { runAgentChat } from "@/lib/agent/chat";
import { listChatSessions, loadChatSession, saveChatTurn } from "@/lib/agent/chat-sessions";
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

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (sessionId) {
      const chat = await loadChatSession(session.id, sessionId);
      if (!chat) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const messages = chat.messages.map((m) => {
        let links: { label: string; href: string }[] | undefined;
        let cards: unknown[] | undefined;
        if (m.metadata) {
          try {
            const meta = JSON.parse(m.metadata) as {
              links?: { label: string; href: string }[];
              cards?: unknown[];
            };
            links = meta.links;
            cards = meta.cards;
          } catch {
            /* ignore */
          }
        }
        return {
          role: m.role as "user" | "assistant",
          content: m.content,
          links,
          cards,
        };
      });

      return NextResponse.json({ sessionId: chat.id, title: chat.title, messages });
    }

    const sessions = await listChatSessions(session.id);
    return NextResponse.json({ sessions });
  } catch (error) {
    return handleAuthError(error, "Failed to load chat sessions");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const { configured, enabled } = getGeminiConfig();

    if (!enabled) {
      return NextResponse.json({ error: "Admin agent is disabled" }, { status: 503 });
    }
    if (!configured) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const history = parseHistory(body);
    const last = history[history.length - 1];

    if (!last || last.role !== "user") {
      return NextResponse.json(
        { error: "Send a messages array ending with a user message" },
        { status: 400 }
      );
    }

    const pageContext = parsePageContext(body);
    const existingSessionId = parseSessionId(body);

    const result = await runAgentChat(
      history,
      { userId: session.id, role: session.role },
      { pageContext, role: session.role }
    );

    let sessionId = existingSessionId;
    try {
      sessionId = await saveChatTurn(session.id, existingSessionId, last.content, {
        reply: result.reply,
        links: result.links,
        cards: result.cards,
      });
    } catch (error) {
      console.error("[admin/agent/chat] session save failed", error);
    }

    const { lastTool, ...response } = result;
    void lastTool;
    return NextResponse.json({ ...response, sessionId });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return handleAuthError(error, "Agent chat failed");
      }
      console.error("[admin/agent/chat]", error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Agent chat failed" }, { status: 500 });
  }
}
