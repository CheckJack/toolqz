import type { AgentToolName } from "./definitions";

/** Tools that require ADMIN role (matches admin API restrictions). */
export const ADMIN_ONLY_TOOLS = new Set<AgentToolName>([
  "publish_tool",
  "delete_tool",
  "feature_tool",
  "publish_blog",
  "search_audit_log",
  "list_subscribers",
]);

export function assertAgentToolAccess(tool: AgentToolName, role: string): void {
  if (role !== "ADMIN" && ADMIN_ONLY_TOOLS.has(tool)) {
    throw new Error(`Only admins can use ${tool.replace(/_/g, " ")}`);
  }
}

export function filterToolsForRole(
  declarations: readonly { name: string }[],
  role: string
): typeof declarations {
  if (role === "ADMIN") return declarations;
  return declarations.filter((d) => !ADMIN_ONLY_TOOLS.has(d.name as AgentToolName));
}
