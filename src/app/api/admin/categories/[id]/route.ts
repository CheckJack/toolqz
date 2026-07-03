import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { categorySlugify } from "@/lib/categories";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.toolCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const data: {
      label?: string;
      slug?: string;
      description?: string | null;
      sortOrder?: number;
      published?: boolean;
    } = {};

    if (typeof body.label === "string" && body.label.trim()) {
      data.label = body.label.trim();
    }

    if (typeof body.slug === "string" && body.slug.trim()) {
      const nextSlug = categorySlugify(body.slug);
      if (nextSlug !== existing.slug) {
        const slugTaken = await prisma.toolCategory.findUnique({ where: { slug: nextSlug } });
        if (slugTaken) {
          return NextResponse.json({ error: "Slug already in use." }, { status: 409 });
        }
        await prisma.tool.updateMany({
          where: { category: existing.slug },
          data: { category: nextSlug },
        });
        data.slug = nextSlug;
      }
    }

    if (body.description !== undefined) {
      data.description =
        typeof body.description === "string" ? body.description.trim() || null : null;
    }

    if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
      data.sortOrder = Number(body.sortOrder);
    }

    if (typeof body.published === "boolean") {
      data.published = body.published;
    }

    const category = await prisma.toolCategory.update({
      where: { id },
      data,
    });

    await logAudit("update", "category", `Updated category "${category.label}"`, {
      userId: session.id,
      entityId: category.id,
    });

    return NextResponse.json(category);
  } catch (error) {
    return handleAuthError(error, "Failed to update category");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    const existing = await prisma.toolCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const toolCount = await prisma.tool.count({ where: { category: existing.slug } });
    if (toolCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete "${existing.label}" — ${toolCount} tool${toolCount === 1 ? "" : "s"} still use it. Reassign those tools first.`,
        },
        { status: 409 }
      );
    }

    await prisma.toolCategory.delete({ where: { id } });

    await logAudit("delete", "category", `Deleted category "${existing.label}"`, {
      userId: session.id,
      entityId: existing.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete category");
  }
}
