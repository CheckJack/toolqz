import { randomBytes } from "node:crypto";
import type { AgentExecutionContext, AgentToolName } from "./definitions";
import { executeAgentTool } from "./run-tools";

export interface PendingConfirmation {
  userId: string;
  tool: AgentToolName;
  args: Record<string, unknown>;
  createdAt: number;
}

const TTL_MS = 10 * 60 * 1000;
const store = new Map<string, PendingConfirmation>();

function prune() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > TTL_MS) store.delete(id);
  }
}

export function createPendingConfirmation(
  userId: string,
  tool: AgentToolName,
  args: Record<string, unknown>
): string {
  prune();
  const id = randomBytes(16).toString("hex");
  store.set(id, { userId, tool, args: { ...args, confirm: true }, createdAt: Date.now() });
  return id;
}

export async function executePendingConfirmation(
  token: string,
  ctx: AgentExecutionContext
): Promise<Awaited<ReturnType<typeof executeAgentTool>> & { reply: string }> {
  prune();
  const pending = store.get(token);
  if (!pending) {
    throw new Error("Confirmation expired or invalid — ask again to preview the action.");
  }
  if (pending.userId !== ctx.userId) {
    throw new Error("Confirmation does not belong to this user.");
  }

  store.delete(token);
  const { result, links, cards } = await executeAgentTool(pending.tool, pending.args, ctx);
  const reply = buildReceiptMessage(pending.tool, result);

  return { result, links, cards, reply };
}

export function buildReceiptMessage(tool: AgentToolName, result: unknown): string {
  if (!result || typeof result !== "object") return "Done.";
  const r = result as Record<string, unknown>;

  if (r.needsConfirmation) return "Action still needs confirmation.";

  if (r.success === false) {
    return typeof r.error === "string" ? r.error : "Action failed.";
  }

  const name = String(r.name ?? r.title ?? r.deleted ?? r.companyName ?? "").trim();

  switch (tool) {
    case "publish_tool":
      return r.published === false
        ? `Unpublished ${name || "tool"}.`
        : `Published ${name || "tool"}.`;
    case "delete_tool":
      return `Deleted ${name || "tool"}.`;
    case "feature_tool":
      return r.featured === false
        ? `Removed ${name || "tool"} from featured.`
        : `Featured ${name || "tool"}.`;
    case "publish_blog":
      return r.published === false
        ? `Unpublished blog post ${name || ""}.`.trim()
        : `Published blog post ${name || ""}.`.trim();
    default:
      return name ? `Updated ${name}.` : "Done.";
  }
}
