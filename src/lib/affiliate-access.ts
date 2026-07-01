import { AffiliateProgram } from "@prisma/client";
import { SessionUser } from "@/lib/auth";

export function assertCanPatchAffiliate(
  session: SessionUser,
  existing: Pick<AffiliateProgram, "assignedToId">,
  body: Record<string, unknown>
) {
  if (session.role === "ADMIN") return;

  const isMine = existing.assignedToId === session.id;
  const isUnassigned = existing.assignedToId === null;

  if (!isMine && !isUnassigned) {
    throw new Error("Forbidden");
  }

  if (body.assignedToId !== undefined) {
    const nextId = body.assignedToId ? String(body.assignedToId) : null;
    if (isUnassigned && nextId !== null && nextId !== session.id) {
      throw new Error("Forbidden");
    }
    if (isMine && nextId !== null && nextId !== session.id) {
      throw new Error("Forbidden");
    }
  }
}

export function canEditAffiliateRow(
  session: SessionUser,
  program: Pick<AffiliateProgram, "assignedToId">
) {
  return (
    session.role === "ADMIN" ||
    program.assignedToId === session.id ||
    program.assignedToId === null
  );
}
