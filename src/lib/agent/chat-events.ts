import type { AgentChatResult } from "./definitions";

export type AgentStreamEvent =
  | { type: "tool_start"; tool: string; label: string }
  | { type: "tool_done"; tool: string; ok: boolean }
  | { type: "text_delta"; delta: string }
  | { type: "done"; result: AgentChatResult & { sessionId?: string } }
  | { type: "error"; message: string };

export function encodeSseEvent(event: AgentStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}
