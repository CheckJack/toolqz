import { NextRequest, NextResponse } from "next/server";
import { affiliateInclude } from "@/lib/affiliate-db";
import {
  buildAffiliateWhere,
  parseAffiliateFilters,
} from "@/lib/affiliate-query";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { affiliateToCsvRow, CSV_HEADERS, toCsv } from "@/lib/affiliates";

const FILTER_PARAMS = [
  "status",
  "priority",
  "category",
  "assignedToId",
  "search",
  "unassigned",
  "hasTool",
  "followups",
  "mine",
] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = request.nextUrl;
    const ids = searchParams.get("ids")?.split(",").filter(Boolean);
    const hasFilters = FILTER_PARAMS.some((key) => searchParams.has(key));

    const where = ids?.length
      ? { id: { in: ids } }
      : hasFilters
        ? buildAffiliateWhere(parseAffiliateFilters(searchParams, session.id))
        : undefined;

    const affiliates = await prisma.affiliateProgram.findMany({
      where,
      include: affiliateInclude,
      orderBy: { companyName: "asc" },
    });

    const csv = toCsv([
      CSV_HEADERS,
      ...affiliates.map((a) => affiliateToCsvRow(a as unknown as Record<string, unknown>)),
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="affiliate-programs.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
