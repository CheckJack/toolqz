import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json();
    const csv = typeof body.csv === "string" ? body.csv.trim() : "";
    if (!csv) {
      return NextResponse.json({ error: "CSV content is required." }, { status: 400 });
    }

    const lines = csv.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must include a header row and at least one data row." },
        { status: 400 }
      );
    }

    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const dateIdx = header.indexOf("date");
    const amountIdx = header.indexOf("amount");
    const slugIdx = header.indexOf("tool_slug");
    const networkIdx = header.indexOf("network");
    const notesIdx = header.indexOf("notes");

    if (dateIdx === -1 || amountIdx === -1) {
      return NextResponse.json(
        { error: "CSV header must include date and amount columns." },
        { status: 400 }
      );
    }

    const rows: {
      date: Date;
      amount: number;
      toolSlug: string | null;
      network: string | null;
      notes: string | null;
    }[] = [];

    for (const line of lines.slice(1) as string[]) {
      const cols = parseCsvLine(line);
      const date = new Date(cols[dateIdx] ?? "");
      const amount = Number(cols[amountIdx] ?? "");
      if (Number.isNaN(date.getTime()) || !Number.isFinite(amount)) continue;
      rows.push({
        date,
        amount,
        toolSlug: slugIdx >= 0 ? cols[slugIdx] || null : null,
        network: networkIdx >= 0 ? cols[networkIdx] || null : null,
        notes: notesIdx >= 0 ? cols[notesIdx] || null : null,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in CSV." }, { status: 400 });
    }

    await prisma.affiliateConversion.createMany({
      data: rows.map((row) => ({
        date: row.date,
        amount: row.amount,
        toolSlug: row.toolSlug,
        network: row.network,
        notes: row.notes,
      })),
    });

    return NextResponse.json({ imported: rows.length });
  } catch (error) {
    return handleAuthError(error, "Failed to import conversions");
  }
}
