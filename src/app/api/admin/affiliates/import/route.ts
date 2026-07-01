import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dedupeKey, serializeAffiliate } from "@/lib/affiliates";
import { AffiliateImportRow } from "@/types/affiliate";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const rows: AffiliateImportRow[] = body.rows ?? [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows to import" }, { status: 400 });
    }

    const tools = await prisma.tool.findMany({ select: { id: true, slug: true, name: true } });
    const slugMap = Object.fromEntries(tools.map((t) => [t.slug, t.id]));
    const nameMap = Object.fromEntries(
      tools.map((t) => [t.name.toLowerCase(), t.id])
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const seen = new Set<string>();

    for (const row of rows) {
      if (!row.companyName?.trim()) {
        skipped++;
        continue;
      }

      const data = serializeAffiliate(row);
      const key = dedupeKey(data.companyName, data.signupUrl);
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);

      const toolId =
        data.toolSlug && slugMap[data.toolSlug]
          ? slugMap[data.toolSlug]
          : nameMap[data.companyName.toLowerCase()] ?? null;

      try {
        const existing = await prisma.affiliateProgram.findFirst({
          where: toolId
            ? { toolId }
            : {
                companyName: { equals: data.companyName },
                signupUrl: data.signupUrl ?? null,
              },
        });

        const payload = {
          companyName: data.companyName,
          category: data.category ?? null,
          commission: data.commission ?? null,
          isRecurring: data.isRecurring ?? null,
          cookieDuration: data.cookieDuration ?? null,
          signupUrl: data.signupUrl ?? null,
          website: data.website ?? null,
          notes: data.notes ?? null,
          status: data.status ?? "PENDING",
          priority: data.priority ?? "MEDIUM",
          affiliateNetwork: data.affiliateNetwork ?? null,
          source: "import",
          toolId,
        };

        if (existing) {
          await prisma.affiliateProgram.update({
            where: { id: existing.id },
            data: payload,
          });
          updated++;
        } else {
          const affiliate = await prisma.affiliateProgram.create({ data: payload });
          await prisma.affiliateActivity.create({
            data: {
              affiliateId: affiliate.id,
              userId: session.id,
              type: "note",
              content: "Imported from CSV",
            },
          });
          created++;
        }
      } catch {
        errors.push(`${data.companyName}: import failed`);
      }
    }

    await logAudit(
      "import",
      "affiliate",
      `Import: ${created} created, ${updated} updated, ${skipped} skipped`,
      { userId: session.id }
    );

    return NextResponse.json({ created, updated, skipped, errors });
  } catch (error) {
    return handleAuthError(error, "Import failed");
  }
}
