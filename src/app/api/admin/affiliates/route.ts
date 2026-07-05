import { NextRequest, NextResponse } from "next/server";
import { affiliateInclude, logAffiliateActivity } from "@/lib/affiliate-db";
import {
  affiliateOrderBy,
  buildAffiliateWhere,
  parseAffiliateFilters,
} from "@/lib/affiliate-query";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = request.nextUrl;

    const filters = parseAffiliateFilters(searchParams, session.id);
    const where = buildAffiliateWhere(filters);
    const sort = searchParams.get("sort") ?? "updated";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE))
    );
    const view = searchParams.get("view") ?? "list";
    const idsOnly = searchParams.get("idsOnly") === "true";
    const orderBy = affiliateOrderBy(sort);

    if (idsOnly) {
      const rows = await prisma.affiliateProgram.findMany({
        where,
        select: { id: true },
        orderBy,
      });
      return NextResponse.json({ ids: rows.map((r) => r.id), total: rows.length });
    }

    const [items, total, categoryRows, allCount, activeCount, appliedCount, inProgressCount, pendingCount] =
      await Promise.all([
      prisma.affiliateProgram.findMany({
        where,
        include: affiliateInclude,
        orderBy,
        ...(view === "kanban"
          ? {}
          : { skip: (page - 1) * pageSize, take: pageSize }),
      }),
      prisma.affiliateProgram.count({ where }),
      prisma.affiliateProgram.groupBy({
        by: ["category"],
        where: { category: { not: null } },
        _count: true,
      }),
      prisma.affiliateProgram.count({
        where: buildAffiliateWhere({ ...filters, status: null }),
      }),
      prisma.affiliateProgram.count({
        where: buildAffiliateWhere({ ...filters, status: "ACTIVE" }),
      }),
      prisma.affiliateProgram.count({
        where: buildAffiliateWhere({ ...filters, status: "APPLIED" }),
      }),
      prisma.affiliateProgram.count({
        where: buildAffiliateWhere({ ...filters, status: "IN_PROGRESS" }),
      }),
      prisma.affiliateProgram.count({
        where: buildAffiliateWhere({ ...filters, status: "PENDING" }),
      }),
    ]);

    const categories = categoryRows
      .map((r) => r.category)
      .filter((c): c is string => !!c)
      .sort();

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      categories,
      view,
      counts: {
        all: allCount,
        ACTIVE: activeCount,
        APPLIED: appliedCount,
        IN_PROGRESS: inProgressCount,
        PENDING: pendingCount,
      },
    });
  } catch (error) {
    return handleAuthError(error, "Failed to load programs");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    if (!body.companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const companyName = String(body.companyName).trim();
    const existing = await prisma.affiliateProgram.findFirst({
      where: { companyName },
    });
    if (!existing) {
      const lower = companyName.toLowerCase();
      const allNames = await prisma.affiliateProgram.findMany({
        select: { companyName: true },
      });
      if (allNames.some((a) => a.companyName.trim().toLowerCase() === lower)) {
        return NextResponse.json(
          { error: "A program with this company name already exists" },
          { status: 409 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "A program with this company name already exists" },
        { status: 409 }
      );
    }

    const affiliate = await prisma.affiliateProgram.create({
      data: {
        companyName,
        website: body.website ?? null,
        signupUrl: body.signupUrl ?? null,
        portalUrl: body.portalUrl ?? null,
        status: String(body.status ?? "PENDING"),
        priority: String(body.priority ?? "MEDIUM"),
        category: body.category ?? null,
        commission: body.commission ?? null,
        isRecurring: body.isRecurring ?? null,
        cookieDuration: body.cookieDuration ?? null,
        affiliateNetwork: body.affiliateNetwork ?? null,
        affiliateUrl: body.affiliateUrl ?? null,
        commissionNotes: body.commissionNotes ?? null,
        notes: body.notes ?? null,
        contactEmail: body.contactEmail ?? null,
        rejectionReason: body.rejectionReason ?? null,
        applicationId: body.applicationId ?? null,
        source: String(body.source ?? "manual"),
        contactedAt: body.contactedAt ? new Date(body.contactedAt) : null,
        nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
        appliedAt: body.appliedAt ? new Date(body.appliedAt) : null,
        approvedAt: body.approvedAt ? new Date(body.approvedAt) : null,
        assignedToId: body.assignedToId ?? null,
        toolId: body.toolId ?? null,
      },
      include: affiliateInclude,
    });

    await logAffiliateActivity(
      affiliate.id,
      "note",
      "Program created manually",
      session.id
    );

    await logAudit("create", "affiliate", `Created program "${affiliate.companyName}"`, {
      userId: session.id,
      entityId: affiliate.id,
    });

    return NextResponse.json(affiliate, { status: 201 });
  } catch (error) {
    return handleAuthError(error, "Failed to create");
  }
}
