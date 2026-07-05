import type { AgentChatResult, AgentExecutionContext, AgentToolName } from "./definitions";
import type { AssistantCard } from "./assistant-cards";
import { filterToolsForRole } from "./tool-access";
import { AGENT_FUNCTION_DECLARATIONS } from "./definitions";
import { buildFollowUpPrompts } from "./follow-ups";
import { executeAgentTool } from "./run-tools";
import { toolProgressLabel } from "./tool-labels";
import type { AgentStreamEvent } from "./chat-events";
import { buildReceiptMessage } from "./pending-confirmation";
import {
  buildFunctionResponseContent,
  buildModelFunctionCallContent,
  runGeminiChatLoop,
  runGeminiChatStream,
  type ChatTurn,
} from "./gemini-chat";

const BASE_SYSTEM_INSTRUCTION = `You are TOOLQZ Admin Assistant — an expert helper for managing the TOOLQZ tool directory backend.

TOOLQZ lists two kinds of tools:
- AFFILIATE partners — have a tracking URL; /go/[slug] redirects through affiliateUrl; show partner disclosure on the site.
- EDITORIAL picks — curated recommendations without affiliate tracking; no partner disclosure.

Affiliate workflow:
- CRM (/admin/affiliates) — pipeline: status, follow-ups, notes, signup URLs.
- Directory (/admin/affiliate-directory) — ACTIVE partners only; bookmark portalUrl (dashboard login) and tracking links.

You can:
- create_tool / create_tools — research URL(s) and create unpublished draft tool listings (default EDITORIAL)
- update_tool — refresh an existing tool from its website (by slug or name)
- set_tool_listing_type — mark a tool AFFILIATE (needs affiliate_url) or EDITORIAL
- list_tools — list tools (filters: category, search, published, listing_type, featured)
- get_tool_issues — catalog health (partner tools missing affiliate URL, zero clicks, drafts)
- feature_tool — feature or unfeature a tool (requires confirmation)
- create_category / list_categories — manage tool categories
- create_blog_draft / list_blog_posts / publish_blog — blog drafts and publishing (publish needs confirmation)
- publish_tool / delete_tool — publish, unpublish, or delete tools (requires confirmation)
- list_affiliates — full CRM search and pipeline
- list_affiliate_directory — ACTIVE partners; filter missing_portal for dashboard links
- update_affiliate — CRM updates: status, follow-up, notes, assign, portal_url, signup_url, affiliate_url
- create_tool_from_affiliate — create a draft tool from an affiliate program
- get_analytics — click stats, top tools, referrers
- get_my_work — personal queue: CRM assignments, overdue follow-ups, admin tasks assigned to you, draft tools, catalog issues
- get_finance_summary — earnings, expenses, net from finance ledger
- create_finance_entry — add earning or expense to finance ledger
- list_finance_entries — recent finance ledger rows
- list_tasks — Tasks board: filter by area, status, assignee, overdue
- create_task — add task (title, area, assignee, due date, priority)
- update_task — change task status, assignee, due date, mark done
- delete_task — remove task (admin only, requires confirmation)
- list_team_members — team list for assignments
- search_audit_log — recent admin audit entries (admin only)
- list_subscribers — mailing list counts (admin only; emails are masked)

Rules:
- Be concise and helpful.
- When tools return lists or analytics, reply with ONE short sentence only — structured UI cards show the data. Never use markdown lists, bullets, or repeat numbers from tool results.
- All creates are drafts unless publish_tool or publish_blog succeeds with confirm:true.
- For publish_tool, delete_tool, feature_tool, and publish_blog: call with confirm:false first OR let the user click Confirm on the card. The UI can confirm server-side without you re-calling.
- Editorial picks do NOT need affiliate URLs — never flag them as broken.
- Admin tasks (/admin/tasks) are separate from affiliate CRM follow-ups — use list_tasks / create_task for the task board.
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
      "\nThe current user is a team MEMBER (not admin). They can create drafts, list data, manage tasks, update assigned affiliates, add finance entries, and view analytics — but not publish, delete, feature, audit log, or subscriber list."
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
  const receipts: string[] = [];
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

        if (
          lastToolResult &&
          lastToolResult.success !== false &&
          !lastToolResult.needsConfirmation
        ) {
          const receipt = buildReceiptMessage(toolName, lastToolResult);
          if (receipt && receipt !== "Done.") receipts.push(receipt);
        }

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
    receipts: receipts.length > 0 ? receipts : undefined,
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
