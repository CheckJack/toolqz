import { NextRequest, NextResponse } from "next/server";
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

    const tool = await prisma.tool.findUnique({ where: { id }, select: { id: true } });
    if (!tool) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const redirects = await prisma.toolSlugRedirect.findMany({
      where: { toolId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, oldSlug: true, createdAt: true },
    });

    return NextResponse.json(redirects);
  } catch (error) {
    return handleAuthError(error, "Failed to load redirects");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const oldSlug = String(body.oldSlug ?? "");

    if (!oldSlug) {
      return NextResponse.json({ error: "oldSlug is required" }, { status: 400 });
    }

    const redirect = await prisma.toolSlugRedirect.findFirst({
      where: { toolId: id, oldSlug },
    });
    if (!redirect) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.toolSlugRedirect.delete({ where: { id: redirect.id } });

    await logAudit("delete_redirect", "tool", `Removed /${oldSlug} redirect`, {
      userId: session.id,
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete redirect");
  }
}
