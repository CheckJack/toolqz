import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STATIC_PAGES = [
  { id: "page-dashboard", label: "Dashboard", href: "/admin" },
  { id: "page-analytics", label: "Click Analytics", href: "/admin/analytics" },
  { id: "page-tools", label: "Tools", href: "/admin/tools" },
  { id: "page-crm", label: "Affiliate CRM", href: "/admin/affiliates" },
  { id: "page-finances", label: "Finances", href: "/admin/finances" },
  { id: "page-messages", label: "Messages", href: "/admin/messages" },
  { id: "page-team", label: "Team", href: "/admin/team" },
  { id: "page-add-tool", label: "Add new tool", href: "/admin/tools/new" },
  { id: "page-add-program", label: "Add affiliate program", href: "/admin/affiliates?action=create" },
  { id: "page-audit", label: "Audit log", href: "/admin/audit" },
  { id: "page-notifications", label: "Notifications", href: "/admin/notifications" },
];

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (!q) {
      return NextResponse.json({ pages: STATIC_PAGES, tools: [], affiliates: [] });
    }

    const lower = q.toLowerCase();
    const pages = STATIC_PAGES.filter((p) => p.label.toLowerCase().includes(lower));

    const [tools, affiliates] = await Promise.all([
      prisma.tool.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { slug: { contains: q } },
            { category: { contains: q } },
          ],
        },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
        take: 10,
      }),
      prisma.affiliateProgram.findMany({
        where: { companyName: { contains: q } },
        select: { id: true, companyName: true, status: true },
        orderBy: { companyName: "asc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({ pages, tools, affiliates });
  } catch (error) {
    return handleAuthError(error, "Search failed");
  }
}
