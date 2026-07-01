import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  SUBSCRIBER_CSV_HEADERS,
  subscriberToCsvRow,
  toCsv,
} from "@/lib/subscribers";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;
    const ids = searchParams.get("ids")?.split(",").filter(Boolean);
    const status = searchParams.get("status")?.trim();
    const search = searchParams.get("search")?.trim();

    const where: {
      id?: { in: string[] };
      status?: string;
      OR?: Array<{ email: { contains: string } } | { name: { contains: string } }>;
    } = {};

    if (ids?.length) {
      where.id = { in: ids };
    } else {
      if (status && status !== "ALL") {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { email: { contains: search } },
          { name: { contains: search } },
        ];
      }
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { subscribedAt: "desc" },
    });

    const csv = toCsv([
      SUBSCRIBER_CSV_HEADERS,
      ...subscribers.map((s) => subscriberToCsvRow(s)),
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="mailing-list.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
