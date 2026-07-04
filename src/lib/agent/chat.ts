import type { AgentChatResult, AgentExecutionContext, AgentToolName } from "./definitions";
import type { AssistantCard } from "./assistant-cards";
import { filterToolsForRole } from "./tool-access";
import { AGENT_FUNCTION_DECLARATIONS } from "./definitions";
import { buildFollowUpPrompts } from "./follow-ups";
import { executeAgentTool } from "./run-tools";
import { toolProgressLabel } from "./tool-labels";
import type { AgentStreamEvent } from "./chat-events";
import {
  buildFunctionResponseContent,
  buildModelFunctionCallContent,
  runGeminiChatLoop,
  runGeminiChatStream,
  type ChatTurn,
} from "./gemini-chat";

const BASE_SYSTEM_INSTRUCTION = `You are TOOLQZ Admin Assistant — an expert helper for managing the TOOLQZ tool directory backend.

You can:
- create_tool / create_tools — research URL(s) and create unpublished draft tool listings
- update_tool — refresh an existing tool from its website (by slug or name)
- list_tools — list or count tools (optional category, search, published filter)
- get_tool_issues — catalog health: missing affiliates, zero clicks, drafts
- feature_tool — feature or unfeature a tool on the homepage (requires confirmation)
- create_category / list_categories — manage tool categories
- create_blog_draft / list_blog_posts / publish_blog — blog drafts and publishing (publish needs confirmation)
- publish_tool / delete_tool — publish, unpublish, or delete tools (requires user confirmation)
- list_affiliates / update_affiliate — CRM search and updates (status, follow-up, notes, assign)
- create_tool_from_affiliate — create a draft tool from an affiliate program
- get_analytics — click stats, top tools, referrers
- get_my_work — personal queue: assigned affiliates, overdue follow-ups, drafts
- get_finance_summary — earnings, expenses, net from finance ledger
- search_audit_log — recent admin audit entries (admin only)
- list_subscribers — mailing list (admin only)

Rules:
- Be concise and helpful.
- When tools return lists or analytics, reply with ONE short sentence only — structured UI cards show the data. Never use markdown lists, bullets, or repeat numbers from tool results.
- All creates are drafts unless publish_tool or publish_blog succeeds with confirm:true.
- For publish_tool, delete_tool, feature_tool, and publish_blog: ALWAYS call with confirm:false first, explain what will happen, and wait for the user to explicitly say yes/confirm before calling with confirm:true.
- For update_tool or update_affiliate, identify the target by slug, name, or company from the user's message.
- Never invent data not returned by tools.
- For greetings or capability questions, answer directly without calling tools.
- Non-admin users cannot publish, delete, feature tools, publish blogs, search audit log, or list subscribers — explain if they ask.`;

const MAX_TOOL_ROUNDS = 5;

export interface RunAgentChatOptions {
  pageContext?: string;
  role?: string;
}

function buildSystemInstruction(options?: RunAgentChatOptions): string {
  const parts = [BASE_SYSTEM_INSTRUCTION];
  if (options?.role && options.role !== "ADMIN") {
    parts.push(
      "\nThe current user is a team MEMBER (not admin). They can create drafts, list data, update assigned affiliates, and view analytics — but not publish, delete, feature, audit log, or subscriber list."
    );
  }
  if (options?.pageContext?.trim()) {
    parts.push(`\nCurrent admin page context: ${options.pageContext.trim()}`);
  }
  return parts.join("");
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

export async function runAgentChatWithEvents(
  history: ChatTurn[],
  ctx: AgentExecutionContext,
  options: RunAgentChatOptions | undefined,
  emit: (event: AgentStreamEvent) => void,
  signal?: AbortSignal
): Promise<AgentChatResult & { lastTool?: AgentToolName | null }> {
  const systemInstruction = buildSystemInstruction({ ...options, role: ctx.role });
  const declarations = filterToolsForRole(AGENT_FUNCTION_DECLARATIONS, ctx.role);

  const extraContents: ReturnType<typeof buildFunctionResponseContent>[] = [];
  const links: AgentChatResult["links"] = [];
  const cards: AssistantCard[] = [];
  let lastTool: AgentToolName | null = null;
  let lastToolResult: Record<string, unknown> | null = null;

  throwIfAborted(signal);
  let result = await runGeminiChatLoop(systemInstruction, history, extraContents, declarations);

  for (let round = 0; round < MAX_TOOL_ROUNDS && result.functionCalls.length > 0; round++) {
    throwIfAborted(signal);
    const calls = result.functionCalls;
    result = { text: undefined, functionCalls: [] };

    for (const call of calls) {
      throwIfAborted(signal);
      const toolName = call.name as AgentToolName;
      emit({
        type: "tool_start",
        tool: toolName,
        label: toolProgressLabel(toolName),
      });

      extraContents.push(buildModelFunctionCallContent(toolName, call.args));

      let ok = true;
      try {
        const { result: toolResult, links: toolLinks, cards: toolCards } = await executeAgentTool(
          toolName,
          call.args,
          ctx
        );
        if (toolLinks) links.push(...toolLinks);
        if (toolCards) cards.push(...toolCards);
        lastTool = toolName;
        lastToolResult =
          toolResult && typeof toolResult === "object"
            ? (toolResult as Record<string, unknown>)
            : null;
        extraContents.push(
          buildFunctionResponseContent(toolName, toolResult as Record<string, unknown>)
        );
      } catch (error) {
        ok = false;
        lastTool = null;
        lastToolResult = null;
        extraContents.push(
          buildFunctionResponseContent(toolName, {
            success: false,
            error: error instanceof Error ? error.message : "Tool execution failed",
          })
        );
      }

      emit({ type: "tool_done", tool: toolName, ok });
    }

    throwIfAborted(signal);
    result = await runGeminiChatLoop(systemInstruction, history, extraContents, declarations);
  }

  throwIfAborted(signal);

  let reply = result.text?.trim() ?? "";
  if (!reply) {
    result = await runGeminiChatStream(
      systemInstruction,
      history,
      extraContents,
      declarations,
      (delta) => emit({ type: "text_delta", delta }),
      signal
    );
    reply = result.text?.trim() ?? "";
  } else {
    emit({ type: "text_delta", delta: reply });
  }

  if (!reply) reply = "Done. Let me know if you need anything else.";

  const followUps = buildFollowUpPrompts(lastTool, lastToolResult);

  return {
    reply,
    links: links.length > 0 ? links : undefined,
    cards: cards.length > 0 ? cards : undefined,
    followUps,
    lastTool,
  };
}

export async function runAgentChat(
  history: ChatTurn[],
  ctx: AgentExecutionContext,
  options?: RunAgentChatOptions
): Promise<AgentChatResult & { lastTool?: AgentToolName | null }> {
  return runAgentChatWithEvents(history, ctx, options, () => {});
}
