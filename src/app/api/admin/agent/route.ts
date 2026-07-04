import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { saveAgentToolDraft } from "@/lib/agent/create-tool";
import { getGeminiConfig } from "@/lib/agent/gemini";
import { parseCreateToolRequest } from "@/lib/agent/parse-request";
import { researchToolDraft } from "@/lib/agent/tool-research";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const { configured, enabled } = getGeminiConfig();
    return NextResponse.json({ configured, enabled });
  } catch (error) {
    return handleAuthError(error, "Failed to load agent status");
  }
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
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const explicitName = typeof body.name === "string" ? body.name.trim() : "";
    const explicitUrl = typeof body.url === "string" ? body.url.trim() : "";

    const parsed = parseCreateToolRequest(message);
    const url = explicitUrl || parsed.url;
    const name = explicitName || parsed.name;

    if (!url) {
      return NextResponse.json(
        { error: "A website URL is required. Example: Create a tool for Notion at https://notion.so" },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
    }

    const { draft } = await researchToolDraft({ name, url });
    const tool = await saveAgentToolDraft(draft, session.id);

    return NextResponse.json({
      success: true,
      message: `Created draft tool "${tool.name}". Review and publish when ready.`,
      tool,
      editUrl: `/admin/tools/${tool.id}`,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return handleAuthError(error, "Agent failed to create tool");
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      console.error("[admin/agent]", error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Agent failed to create tool" }, { status: 500 });
  }
}
