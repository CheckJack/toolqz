import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseSubscriberStatus } from "@/lib/subscribers";
import { SubscriberImportRow } from "@/types/subscriber";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const rows: SubscriberImportRow[] = body.rows ?? [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows to import" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const seen = new Set<string>();

    for (const row of rows) {
      const email = row.email?.trim().toLowerCase();
      if (!email) {
        skipped++;
        continue;
      }

      if (seen.has(email)) {
        skipped++;
        continue;
      }
      seen.add(email);

      const status = parseSubscriberStatus(row.status);
      const name = row.name?.trim() || null;
      const source = row.source?.trim() || "import";

      try {
        const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

        if (existing) {
          await prisma.newsletterSubscriber.update({
            where: { email },
            data: {
              name: name ?? existing.name,
              status,
              source,
              subscribedAt: status === "ACTIVE" ? new Date() : existing.subscribedAt,
              unsubscribedAt: status === "UNSUBSCRIBED" ? new Date() : null,
            },
          });
          updated++;
        } else {
          await prisma.newsletterSubscriber.create({
            data: {
              email,
              name,
              status,
              source,
              unsubscribedAt: status === "UNSUBSCRIBED" ? new Date() : null,
            },
          });
          created++;
        }
      } catch {
        errors.push(`${email}: import failed`);
      }
    }

    await logAudit(
      "import",
      "subscriber",
      `Import: ${created} created, ${updated} updated, ${skipped} skipped`,
      { userId: session.id }
    );

    return NextResponse.json({ created, updated, skipped, errors });
  } catch (error) {
    return handleAuthError(error, "Import failed");
  }
}
