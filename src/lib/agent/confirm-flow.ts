import type { AgentToolName } from "./definitions";
import { createPendingConfirmation } from "./pending-confirmation";

export function needsConfirmationWithToken(
  userId: string,
  tool: AgentToolName,
  args: Record<string, unknown>,
  confirm: unknown,
  preview: Record<string, unknown>
): ({ needsConfirmation: true; confirmationToken: string } & Record<string, unknown>) | null {
  if (confirm === true) return null;
  const confirmationToken = createPendingConfirmation(userId, tool, args);
  return { needsConfirmation: true, confirmationToken, ...preview };
}
