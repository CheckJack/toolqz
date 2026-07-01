import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim();

    const redirects = await prisma.toolSlugRedirect.findMany({
      where: search
        ? {
            OR: [
              { oldSlug: { contains: search } },
              { tool: { name: { contains: search } } },
              { tool: { slug: { contains: search } } },
            ],
          }
        : undefined,
      include: {
        tool: { select: { id: true, name: true, slug: true, published: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(
      redirects.map((r) => ({
        id: r.id,
        oldSlug: r.oldSlug,
        createdAt: r.createdAt,
        tool: r.tool,
      }))
    );
  } catch (error) {
    return handleAuthError(error, "Failed to load redirects");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const oldSlug = String(body.oldSlug ?? "");

    if (!oldSlug) {
      return NextResponse.json({ error: "oldSlug is required" }, { status: 400 });
    }

    const redirect = await prisma.toolSlugRedirect.findUnique({
      where: { oldSlug },
      include: { tool: { select: { id: true, name: true } } },
    });
    if (!redirect) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.toolSlugRedirect.delete({ where: { id: redirect.id } });

    await logAudit(
      "delete_redirect",
      "tool",
      `Removed /${oldSlug} → "${redirect.tool.name}"`,
      { userId: session.id, entityId: redirect.tool.id }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete redirect");
  }
}
