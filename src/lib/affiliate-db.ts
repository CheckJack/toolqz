import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit-log";
import { SessionUser } from "@/lib/auth";

export const affiliateInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  tool: { select: { id: true, name: true, slug: true, published: true } },
  _count: { select: { activities: true } },
} satisfies Prisma.AffiliateProgramInclude;

export const affiliateDetailInclude = {
  ...affiliateInclude,
  activities: {
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.AffiliateProgramInclude;

export async function logAffiliateActivity(
  affiliateId: string,
  type: string,
  content: string,
  userId?: string | null
) {
  return prisma.affiliateActivity.create({
    data: { affiliateId, type, content, userId: userId ?? null },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function syncAffiliateUrlToTool(
  toolId: string | null,
  affiliateUrl: string | null
) {
  if (toolId && affiliateUrl) {
    await prisma.tool.update({
      where: { id: toolId },
      data: { affiliateUrl },
    });
  }
}

export function buildAffiliateData(
  body: Record<string, unknown>,
  existing?: { status?: string }
) {
  const status = body.status as string | undefined;
  const data: Prisma.AffiliateProgramUpdateInput = {};

  if (body.companyName !== undefined) data.companyName = String(body.companyName);
  if (body.website !== undefined) data.website = body.website as string | null;
  if (body.signupUrl !== undefined) data.signupUrl = body.signupUrl as string | null;
  if (status !== undefined) data.status = status;
  if (body.priority !== undefined) data.priority = String(body.priority);
  if (body.category !== undefined) data.category = body.category as string | null;
  if (body.commission !== undefined) data.commission = body.commission as string | null;
  if (body.isRecurring !== undefined) data.isRecurring = body.isRecurring as boolean | null;
  if (body.cookieDuration !== undefined)
    data.cookieDuration = body.cookieDuration as string | null;
  if (body.affiliateNetwork !== undefined)
    data.affiliateNetwork = body.affiliateNetwork as string | null;
  if (body.affiliateUrl !== undefined) data.affiliateUrl = body.affiliateUrl as string | null;
  if (body.commissionNotes !== undefined)
    data.commissionNotes = body.commissionNotes as string | null;
  if (body.notes !== undefined) data.notes = body.notes as string | null;
  if (body.contactEmail !== undefined) data.contactEmail = body.contactEmail as string | null;
  if (body.rejectionReason !== undefined)
    data.rejectionReason = body.rejectionReason as string | null;
  if (body.applicationId !== undefined)
    data.applicationId = body.applicationId as string | null;
  if (body.source !== undefined) data.source = body.source as string | null;
  if (body.contactedAt !== undefined)
    data.contactedAt = body.contactedAt ? new Date(String(body.contactedAt)) : null;
  if (body.nextFollowUpAt !== undefined)
    data.nextFollowUpAt = body.nextFollowUpAt
      ? new Date(String(body.nextFollowUpAt))
      : null;
  if (body.appliedAt !== undefined)
    data.appliedAt = body.appliedAt ? new Date(String(body.appliedAt)) : null;
  if (body.approvedAt !== undefined)
    data.approvedAt = body.approvedAt ? new Date(String(body.approvedAt)) : null;
  if (body.assignedToId !== undefined) {
    data.assignedTo = body.assignedToId
      ? { connect: { id: String(body.assignedToId) } }
      : { disconnect: true };
  }
  if (body.toolId !== undefined) {
    data.tool = body.toolId
      ? { connect: { id: String(body.toolId) } }
      : { disconnect: true };
  }

  if (status === "APPLIED" && !body.appliedAt && existing?.status !== "APPLIED") {
    data.appliedAt = new Date();
  }
  if (status === "ACTIVE" && !body.approvedAt && existing?.status !== "ACTIVE") {
    data.approvedAt = new Date();
  }

  return data;
}

export async function patchAffiliateWithActivity(
  id: string,
  body: Record<string, unknown>,
  session: SessionUser
) {
  const existing = await prisma.affiliateProgram.findUnique({ where: { id } });
  if (!existing) return null;

  const data = buildAffiliateData(body, existing);
  const affiliate = await prisma.affiliateProgram.update({
    where: { id },
    data,
    include: affiliateDetailInclude,
  });

  if (body.status && body.status !== existing.status) {
    await logAffiliateActivity(
      id,
      "status_change",
      `Status changed from ${existing.status} to ${body.status}`,
      session.id
    );
    await logAudit(
      "status_change",
      "affiliate",
      `${existing.companyName}: ${existing.status} → ${body.status}`,
      { userId: session.id, entityId: id }
    );
  }

  if (
    body.assignedToId !== undefined &&
    String(body.assignedToId ?? "") !== String(existing.assignedToId ?? "")
  ) {
    await logAudit(
      "assign",
      "affiliate",
      `${existing.companyName} reassigned`,
      { userId: session.id, entityId: id }
    );
  }

  if (body.affiliateUrl && affiliate.toolId) {
    await syncAffiliateUrlToTool(affiliate.toolId, String(body.affiliateUrl));
  } else if (body.status === "ACTIVE" && body.affiliateUrl && affiliate.toolId) {
    await syncAffiliateUrlToTool(affiliate.toolId, String(body.affiliateUrl));
  }

  return affiliate;
}
