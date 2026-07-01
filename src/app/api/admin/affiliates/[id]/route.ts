import { NextRequest, NextResponse } from "next/server";
import {
  affiliateDetailInclude,
  patchAffiliateWithActivity,
  syncAffiliateUrlToTool,
} from "@/lib/affiliate-db";
import { assertCanPatchAffiliate } from "@/lib/affiliate-access";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;

    const affiliate = await prisma.affiliateProgram.findUnique({
      where: { id },
      include: affiliateDetailInclude,
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(affiliate);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.affiliateProgram.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    assertCanPatchAffiliate(session, existing, body);

    const affiliate = await patchAffiliateWithActivity(id, body, session);
    if (!affiliate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.affiliateUrl && affiliate.toolId) {
      await syncAffiliateUrlToTool(affiliate.toolId, String(body.affiliateUrl));
    }

    return NextResponse.json(affiliate);
  } catch (error) {
    return handleAuthError(error, "Failed to update");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const program = await prisma.affiliateProgram.findUnique({
      where: { id },
      select: { companyName: true },
    });

    await prisma.affiliateProgram.delete({ where: { id } });

    await logAudit("delete", "affiliate", program ? `Deleted "${program.companyName}"` : undefined, {
      userId: session.id,
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete");
  }
}
