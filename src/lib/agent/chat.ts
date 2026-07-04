import type { AgentChatResult, AgentToolName, ChatLink } from "./definitions";
import type { AssistantCard } from "./assistant-cards";
import { executeAgentTool } from "./run-tools";
import {
  buildFunctionResponseContent,
  buildModelFunctionCallContent,
  runGeminiChatLoop,
  type ChatTurn,
} from "./gemini-chat";

const SYSTEM_INSTRUCTION = `You are TOOLQZ Admin Assistant — an expert helper for managing the TOOLQZ tool directory backend.

You can:
- create_tool — research a URL and create a new unpublished draft tool listing
- update_tool — refresh an existing tool from its website (by slug or name)
- list_tools — list or count tools (optional category, search, published filter)
- create_category — add a new tool category (label required)
- create_blog_draft — write an unpublished blog post from a topic
- publish_tool — publish or unpublish a tool (requires user confirmation)
- delete_tool — permanently delete a tool (requires user confirmation)
- list_affiliates — search affiliate CRM programs
- create_tool_from_affiliate — create a draft tool from an affiliate program
- get_analytics — click stats, top tools, referrers

Rules:
- Be concise and helpful.
- When tools return lists or analytics, reply with ONE short sentence only — structured UI cards show the data. Never use markdown lists, bullets, or repeat numbers from tool results.
- All creates are drafts unless publish_tool succeeds with confirm:true.
- For publish_tool and delete_tool: ALWAYS call with confirm:false first, explain what will happen, and wait for the user to explicitly say yes/confirm before calling with confirm:true.
- For update_tool, identify the tool by slug or name from the user's message.
- Never invent data not returned by tools.
- For greetings or capability questions, answer directly without calling tools.`;

const MAX_TOOL_ROUNDS = 3;

export async function runAgentChat(
  history: ChatTurn[],
  userId: string
): Promise<AgentChatResult> {
  const extraContents: ReturnType<typeof buildFunctionResponseContent>[] = [];
  const links: ChatLink[] = [];
  const cards: AssistantCard[] = [];

  let result = await runGeminiChatLoop(SYSTEM_INSTRUCTION, history, extraContents);

  for (let round = 0; round < MAX_TOOL_ROUNDS && result.functionCalls.length > 0; round++) {
    const calls = result.functionCalls;
    result = { text: undefined, functionCalls: [] };

    for (const call of calls) {
      const toolName = call.name as AgentToolName;
      extraContents.push(buildModelFunctionCallContent(toolName, call.args));

      try {
        const { result: toolResult, links: toolLinks, cards: toolCards } = await executeAgentTool(
          toolName,
          call.args,
          userId
        );
        if (toolLinks) links.push(...toolLinks);
        if (toolCards) cards.push(...toolCards);
        extraContents.push(
          buildFunctionResponseContent(toolName, toolResult as Record<string, unknown>)
        );
      } catch (error) {
        extraContents.push(
          buildFunctionResponseContent(toolName, {
            success: false,
            error: error instanceof Error ? error.message : "Tool execution failed",
          })
        );
      }
    }

    result = await runGeminiChatLoop(SYSTEM_INSTRUCTION, history, extraContents);
  }

  const reply =
    result.text?.trim() ||
    "Done. Let me know if you need anything else.";

  return {
    reply,
    links: links.length > 0 ? links : undefined,
    cards: cards.length > 0 ? cards : undefined,
  };
}
