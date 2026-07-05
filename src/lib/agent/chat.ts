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
- create_blog_draft / list_blog_posts / publish_blog / update_blog_post — blog drafts, edits, publishing (publish and delete need confirmation)
- delete_blog_post — permanently delete a post (admin only, requires confirmation)
- publish_tool / delete_tool — publish, unpublish, or delete tools (requires confirmation)
- list_affiliates — full CRM search and pipeline
- create_affiliate — add a new affiliate program to CRM (company_name required)
- list_affiliate_directory — ACTIVE partners; filter missing_portal for dashboard links
- update_affiliate — CRM updates: status, follow-up, notes, assign, portal_url, signup_url, affiliate_url
- create_tool_from_affiliate — create a draft tool from an affiliate program
- get_analytics — click stats, top tools, referrers
- get_my_work — personal queue: CRM assignments, overdue follow-ups, admin tasks assigned to you, draft tools, catalog issues
- get_finance_summary — earnings, expenses, net from finance ledger
- create_finance_entry — add earning or expense to finance ledger
- list_finance_entries — recent finance ledger rows
- update_finance_entry — edit a ledger entry (entry_id or match_description)
- delete_finance_entry — remove ledger entry (admin only, requires confirmation)
- list_tasks — Tasks board: filter by area, status, assignee, overdue
- create_task — add task (title, area, assignee, due date, priority)
- update_task — change task status, assignee, due date, mark done
- delete_task — remove task (admin only, requires confirmation)
- search_playbook — find reusable Q&A for affiliate forms, emails, company info (intelligent search on questions and aliases)
- create_playbook_snippet — add Playbook entry (question, answer, aliases)
- update_playbook_snippet — edit Playbook entry by snippet_id or snippet_question
- delete_playbook_snippet — remove Playbook entry (admin only, requires confirmation)
- list_team_members — team list for assignments
- search_audit_log — recent admin audit entries (admin only)
- list_subscribers — mailing list counts (admin only; emails are masked)

Rules:
- Be concise, friendly, and conversational — especially in voice/chat when the user is speaking rather than typing.
- When tools return lists or analytics, reply with ONE short sentence only — structured UI cards show the data. Never use markdown lists, bullets, or repeat numbers from tool results.

Gathering information before acting:
- Before calling a create or update tool, check you have the required inputs. If anything essential is missing or unclear, ask ONE short follow-up question listing only what you still need — do not call the tool yet.
- Required fields: create_tool/create_tools → url(s); create_affiliate → company_name; create_task → title; create_playbook_snippet → question + answer; create_finance_entry → type + amount + description; create_blog_draft → topic; set_tool_listing_type AFFILIATE → affiliate_url (or existing URL on tool).
- For partial create requests ("add a task", "log an expense", "new affiliate"), ask for the missing required fields in plain language. Offer sensible defaults only when obvious (e.g. status PENDING for new affiliates, today's date for finance if user says "today").
- If the user names an entity vaguely and multiple could match, call list_* first OR ask which one — never guess. Tool errors listing multiple matches mean you should ask the user to pick.
- After the user supplies missing info, proceed without re-asking what they already gave.

Speech and tone:
- Keep replies short for voice (1–3 sentences when not pasting Playbook text).
- When creating something, briefly confirm what you understood before acting if the request was long or ambiguous.
- When you cannot do something (permissions, missing data, out of scope), say so plainly and suggest what the user can provide or do in the admin UI.

Operational rules:
- All creates are drafts unless publish_tool or publish_blog succeeds with confirm:true.
- For publish_tool, delete_tool, feature_tool, publish_blog, delete_blog_post, delete_task, delete_playbook_snippet, and delete_finance_entry: call with confirm:false first OR let the user click Confirm on the card. The UI can confirm server-side without you re-calling.
- Editorial picks do NOT need affiliate URLs — never flag them as broken.
- Admin tasks (/admin/tasks) are separate from affiliate CRM follow-ups — use list_tasks / create_task for the task board.
- Playbook (/admin/playbook) stores copy-paste answers for affiliate signup forms, emails, and company facts. When the user asks what to write or paste (e.g. "why should you promote us"), call search_playbook with their phrase. If they need text to paste, include the full answer from the top matching snippet in your reply — cards show previews only.
- For update_tool, update_affiliate, update_blog_post, update_task, update_playbook_snippet, or update_finance_entry: identify the target by slug, name, company, post title, task title, snippet question, or entry match_description from the user's message.
- Never invent data not returned by tools.
- For greetings or capability questions, answer directly without calling tools.
- Non-admin users cannot publish, delete, feature tools or blogs, delete tasks or playbook snippets or finance entries, search audit log, or list subscribers — explain if they ask.`;

const MAX_TOOL_ROUNDS = 5;

export interface RunAgentChatOptions {
  pageContext?: string;
  role?: string;
}

function buildSystemInstruction(options?: RunAgentChatOptions): string {
  const parts = [BASE_SYSTEM_INSTRUCTION];
  if (options?.role && options.role !== "ADMIN") {
    parts.push(
      "\nThe current user is a team MEMBER (not admin). They can create drafts, list data, manage tasks, create/update affiliates and finance entries, and view analytics — but not publish, delete, feature, audit log, subscriber list, or any delete_* tools."
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
