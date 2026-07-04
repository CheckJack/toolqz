import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createToolFromAffiliateProgram } from "@/lib/tool-from-affiliate";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const { affiliateId } = await request.json();

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId is required" }, { status: 400 });
    }

    const tool = await createToolFromAffiliateProgram(String(affiliateId), session.id);
    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tool";
    const status = message.includes("not found") ? 404 : message.includes("already linked") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
