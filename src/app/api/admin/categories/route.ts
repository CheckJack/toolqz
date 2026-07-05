import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { categorySlugify, listAdminCategories } from "@/lib/categories";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireSession();
    const { items, writable } = await listAdminCategories();
    return NextResponse.json({ items, writable });
  } catch (error) {
    return handleAuthError(error, "Failed to load categories");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const label = typeof body.label === "string" ? body.label.trim() : "";
    const slugInput = typeof body.slug === "string" ? body.slug.trim() : "";
    const slug = slugInput ? categorySlugify(slugInput) : categorySlugify(label);
    const description =
      typeof body.description === "string" ? body.description.trim() || null : null;
    const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;
    const published = body.published !== false;

    if (!label) {
      return NextResponse.json({ error: "Label is required." }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    const existing = await prisma.toolCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
    }

    const category = await prisma.toolCategory.create({
      data: { slug, label, description, sortOrder, published },
    });

    await logAudit("create", "category", `Created category "${category.label}"`, {
      userId: session.id,
      entityId: category.id,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleAuthError(error, "Failed to create category");
  }
}
