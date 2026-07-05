import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isPlaybookCategory,
  normalizePlaybookCategory,
  PLAYBOOK_CATEGORIES,
} from "@/constants/admin-playbook";
import {
  normalizeStoredAnswer,
  preparePlaybookAnswerForStorage,
  serializePlaybookSnippet,
} from "@/lib/playbook-snippet";
import { searchPlaybookSnippets } from "@/lib/playbook-search";

const snippetInclude = {
  createdBy: { select: { id: true, name: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const category = searchParams.get("category")?.trim() ?? "";

    const where = {
      ...(category && isPlaybookCategory(category) ? { category } : {}),
    };

    const snippets = await prisma.adminPlaybookSnippet.findMany({
      where,
      include: snippetInclude,
      orderBy: [{ pinned: "desc" }, { sortOrder: "asc" }, { question: "asc" }],
    });

    const results = searchPlaybookSnippets(snippets, q);
    const items = results.map((row) =>
      serializePlaybookSnippet(row.snippet as (typeof snippets)[number], {
        score: row.score,
        matchReason: row.matchReason,
      })
    );

    const countsByCategory = Object.fromEntries(
      PLAYBOOK_CATEGORIES.map((c) => [
        c.value,
        snippets.filter((s) => s.category === c.value).length,
      ])
    );

    return NextResponse.json({
      items,
      total: items.length,
      query: q,
      counts: {
        all: snippets.length,
        categories: countsByCategory,
      },
    });
  } catch (error) {
    return handleAuthError(error, "Failed to load playbook");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const question = typeof body.question === "string" ? body.question.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }
    if (!answer) {
      return NextResponse.json({ error: "Answer is required" }, { status: 400 });
    }

    const category = normalizePlaybookCategory(body.category);
    const aliases = typeof body.aliases === "string" ? body.aliases.trim() || null : null;
    const tags = typeof body.tags === "string" ? body.tags.trim() || null : null;
    const pinned = body.pinned === true;
    const sensitive = body.sensitive === true;

    const maxOrder = await prisma.adminPlaybookSnippet.aggregate({
      where: { category },
      _max: { sortOrder: true },
    });

    const snippet = await prisma.adminPlaybookSnippet.create({
      data: {
        question,
        answer: preparePlaybookAnswerForStorage(answer, sensitive),
        category,
        aliases,
        tags,
        pinned,
        sensitive,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        createdById: session.id,
      },
      include: snippetInclude,
    });

    await logAudit(
      "create",
      "playbook",
      `Added playbook snippet "${snippet.question}"${sensitive ? " (sensitive)" : ""}`,
      { userId: session.id, entityId: snippet.id }
    );

    return NextResponse.json(
      { snippet: serializePlaybookSnippet(snippet, { reveal: !sensitive }) },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error, "Failed to create snippet");
  }
}
