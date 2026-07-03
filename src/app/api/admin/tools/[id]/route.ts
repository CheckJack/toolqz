import { NextRequest, NextResponse } from "next/server";
import { assertToolCategoryExists } from "@/lib/categories";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildToolData, serializeTool } from "@/lib/tool-payload";

const MEMBER_RESTRICTED_FIELDS = ["published", "featured", "slug"] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;

    const tool = await prisma.tool.findUnique({
      where: { id },
      include: {
        _count: { select: { clicks: true } },
        affiliate: { select: { id: true, status: true, companyName: true } },
      },
    });

    if (!tool) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(serializeTool(tool));
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

    if (session.role !== "ADMIN") {
      for (const key of MEMBER_RESTRICTED_FIELDS) {
        if (key in body) {
          return NextResponse.json(
            { error: "Only admins can change publish, featured, or slug" },
            { status: 403 }
          );
        }
      }
    }

    const existing = await prisma.tool.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.slug) {
      const conflict = await prisma.tool.findFirst({
        where: { slug: body.slug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      }
    }

    if (body.slug && body.slug !== existing.slug) {
      await prisma.toolSlugRedirect.upsert({
        where: { oldSlug: existing.slug },
        create: { oldSlug: existing.slug, toolId: id },
        update: { toolId: id },
      });
      await logAudit(
        "slug_redirect",
        "tool",
        `/${existing.slug} → /${body.slug}`,
        { userId: session.id, entityId: id }
      );
    }

    if (body.category !== undefined) {
      try {
        await assertToolCategoryExists(String(body.category));
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid category" },
          { status: 400 }
        );
      }
    }

    const tool = await prisma.tool.update({
      where: { id },
      data: buildToolData(body) as Parameters<typeof prisma.tool.update>[0]["data"],
      include: {
        _count: { select: { clicks: true } },
        affiliate: { select: { id: true, status: true, companyName: true } },
      },
    });

    if (body.published !== undefined && body.published !== existing.published) {
      await logAudit(
        body.published ? "publish" : "unpublish",
        "tool",
        `${body.published ? "Published" : "Unpublished"} "${tool.name}"`,
        { userId: session.id, entityId: id }
      );
    }
    if (body.featured !== undefined && body.featured !== existing.featured) {
      await logAudit(
        body.featured ? "feature" : "unfeature",
        "tool",
        `${body.featured ? "Featured" : "Unfeatured"} "${tool.name}"`,
        { userId: session.id, entityId: id }
      );
    }

    const metaOnly = new Set(["published", "featured", "slug"]);
    const hasContentChange = Object.keys(body).some((key) => !metaOnly.has(key));
    if (hasContentChange) {
      await logAudit("update", "tool", `Updated "${tool.name}"`, {
        userId: session.id,
        entityId: id,
      });
    }

    return NextResponse.json(serializeTool(tool));
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

    const tool = await prisma.tool.findUnique({
      where: { id },
      select: { name: true, slug: true },
    });

    await prisma.tool.delete({ where: { id } });

    await logAudit("delete", "tool", tool ? `Deleted tool "${tool.name}"` : undefined, {
      userId: session.id,
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete");
  }
}
