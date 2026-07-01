import { prisma } from "@/lib/db";

export async function logAudit(
  action: string,
  entity: string,
  detail?: string | null,
  options?: { userId?: string | null; entityId?: string | null }
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        action,
        entity,
        entityId: options?.entityId ?? null,
        detail: detail ?? null,
        userId: options?.userId ?? null,
      },
    });
  } catch {
    // Non-blocking — audit must not break primary operations
  }
}
