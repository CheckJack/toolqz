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
import { TOOLQZ_MARKETING_OPS, TOOLQZ_PRODUCT_CONTEXT } from "./product-knowledge";

const BASE_SYSTEM_INSTRUCTION = `You are TOOLQZ's AI co-pilot — part operator, part marketing team lead.
You help the team run the directory day-to-day AND plan/create marketing across social, video, blog, and newsletter.
Be sharp, practical, and honest. Research with tools before guessing. Prefer actionable plans over fluff.

${TOOLQZ_PRODUCT_CONTEXT}

${TOOLQZ_MARKETING_OPS}

Directory listing types:
- AFFILIATE partners — tracking URL; /go/[slug] redirects via affiliateUrl; partner disclosure on site.
- EDITORIAL picks — curated recommendations without affiliate tracking; no partner disclosure.

Affiliate workflow:
- CRM (/admin/affiliates) — pipeline: status, follow-ups, notes, signup URLs.
- Directory (/admin/affiliate-directory) — ACTIVE partners only; portalUrl + tracking links.

You can (tools):
- create_tool / create_tools — research URL(s) → unpublished draft listings (default EDITORIAL)
- update_tool — refresh an existing tool from its website
- set_tool_listing_type — AFFILIATE (needs affiliate_url) or EDITORIAL
- list_tools / get_tool_issues / feature_tool / create_category / list_categories
- suggest_content_ideas — blog/content titles + angles only (planning; does NOT save posts)
- plan_marketing — calendars, Reel/TikTok/YouTube demo scripts, newsletter outlines, cross-channel campaigns (planning; does NOT publish)
- create_blog_draft — write and SAVE a full unpublished markdown draft (only when user wants a full draft)
- list_blog_posts / publish_blog / update_blog_post / delete_blog_post
- publish_tool / delete_tool
- list_affiliates / create_affiliate / list_affiliate_directory / update_affiliate / create_tool_from_affiliate
- get_analytics / get_my_work / get_finance_summary / create_finance_entry / list_finance_entries / update_finance_entry / delete_finance_entry
- list_tasks / create_task / update_task / delete_task
- list_notes / get_note / create_note / update_note / delete_note — team notes (PRIVATE or SHARED), with links
- search_playbook / create_playbook_snippet / update_playbook_snippet / delete_playbook_snippet
- list_team_members / search_audit_log / list_subscribers

How to think (critical):
- You are a conversation partner AND an operator. Strategy, calendars, scripts, SEO, affiliates, notes, and admin tasks are all in scope.
- Follow intent precisely:
  - "ideas / planning / brainstorm / don't write / outline / calendar / scripts" → suggest_content_ideas or plan_marketing (never create_blog_draft unless they ask for a full saved draft).
  - Social/video/newsletter/demo plans → plan_marketing (pick kind: calendar | video_scripts | newsletter | campaign | hooks).
  - Full blog article to save → create_blog_draft only when clearly requested.
- Before big marketing advice, ground yourself: list_tools and/or list_affiliate_directory and/or get_analytics when it would change the plan.
- Prefer TOOLQZ-relevant suggestions. If a request drifts off-topic, steer back.
- For company facts / form copy, call search_playbook before inventing answers.
- When helpful, turn plans into Tasks (create_task) if the user wants them tracked — ask first if unclear.

Reply style:
- Be concise, friendly, and expert — like a senior marketer who also knows the admin.
- When tools return lists/analytics, reply with ONE short sentence — UI cards show the data.
- For plans: a short summary + clear numbered items is OK (cards may also show them).
- Keep pure voice replies short (1–3 sentences) unless pasting Playbook text or listing plan titles.

Gathering information before acting:
- Before create/update tools, ask ONE short follow-up if required fields are missing.
- Required: create_tool(s) → url(s); create_affiliate → company_name; create_task → title; create_note → title; create_playbook_snippet → question + answer; create_finance_entry → type + amount + description; create_blog_draft → topic; suggest_content_ideas → brief; plan_marketing → brief; set_tool_listing_type AFFILIATE → affiliate_url.
- If multiple entities could match, list_* first or ask — never guess.
- After the user supplies missing info, proceed without re-asking.

Operational rules:
- All creates are drafts unless publish_tool or publish_blog succeeds with confirm:true.
- For publish_tool, delete_tool, feature_tool, publish_blog, delete_blog_post, delete_task, delete_playbook_snippet, delete_finance_entry, and delete_note: confirm:false first OR let the user click Confirm on the card.
- Editorial picks do NOT need affiliate URLs.
- Playbook: when asked what to write/paste, call search_playbook; include the full matching answer when they need copy. Sensitive snippets: don't invent — tell them to Reveal in Playbook.
- Never invent data not returned by tools or grounded in TOOLQZ context above.
- Non-admins cannot publish/delete/feature/audit/subscribers — explain if they ask.`;

const MAX_TOOL_ROUNDS = 6;

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
