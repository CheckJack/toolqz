import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { runAgentChat } from "@/lib/agent/chat";
import type { ChatTurn } from "@/lib/agent/gemini-chat";
import { getGeminiConfig } from "@/lib/agent/gemini";
import { requireAdmin } from "@/lib/auth";

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

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
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

    const result = await runAgentChat(history, session.id);
    return NextResponse.json(result);
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
