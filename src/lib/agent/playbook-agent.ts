import { prisma } from "@/lib/db";
import {
  isPlaybookCategory,
  normalizePlaybookCategory,
  PLAYBOOK_CATEGORIES,
} from "@/constants/admin-playbook";
import { searchPlaybookSnippets } from "@/lib/playbook-search";

export function serializeAgentPlaybookSnippet(
  snippet: {
    id: string;
    question: string;
    answer: string;
    category: string;
    aliases: string | null;
    tags: string | null;
    pinned: boolean;
    sortOrder: number;
  },
  extras?: { score?: number; matchReason?: string | null }
) {
  return {
    id: snippet.id,
    question: snippet.question,
    answer: snippet.answer,
    category: snippet.category,
    aliases: snippet.aliases,
    tags: snippet.tags,
    pinned: snippet.pinned,
    sortOrder: snippet.sortOrder,
    score: extras?.score ?? null,
    matchReason: extras?.matchReason ?? null,
    playbookUrl: "/admin/playbook",
  };
}

export async function findPlaybookSnippet(args: Record<string, unknown>) {
  const id = typeof args.snippet_id === "string" ? args.snippet_id.trim() : "";
  const question =
    typeof args.question === "string"
      ? args.question.trim()
      : typeof args.snippet_question === "string"
        ? args.snippet_question.trim()
        : "";

  if (id) {
    return prisma.adminPlaybookSnippet.findUnique({ where: { id } });
  }
  if (question) {
    return prisma.adminPlaybookSnippet.findFirst({
      where: { question: { contains: question } },
      orderBy: { updatedAt: "desc" },
    });
  }
  return null;
}

export async function searchPlaybookForAgent(args: Record<string, unknown>) {
  const query = typeof args.query === "string" ? args.query.trim() : "";
  const category = typeof args.category === "string" ? args.category.trim() : "";
  const limit = Math.min(15, Math.max(1, Number(args.limit) || 8));

  const where = {
    ...(category && isPlaybookCategory(category) ? { category } : {}),
  };

  const rows = await prisma.adminPlaybookSnippet.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { sortOrder: "asc" }, { question: "asc" }],
  });

  const ranked = searchPlaybookSnippets(rows, query).slice(0, limit);
  const snippets = ranked.map((row) =>
    serializeAgentPlaybookSnippet(row.snippet, {
      score: row.score,
      matchReason: row.matchReason,
    })
  );

  const countsByCategory = Object.fromEntries(
    PLAYBOOK_CATEGORIES.map((c) => [
      c.value,
      rows.filter((r) => r.category === c.value).length,
    ])
  );

  return {
    query,
    total: rows.length,
    showing: snippets.length,
    snippets,
    countsByCategory,
    topAnswer: snippets[0]?.answer ?? null,
    topQuestion: snippets[0]?.question ?? null,
  };
}

export async function createPlaybookSnippetForAgent(
  args: Record<string, unknown>,
  userId: string
) {
  const question = typeof args.question === "string" ? args.question.trim() : "";
  const answer = typeof args.answer === "string" ? args.answer.trim() : "";
  if (!question) throw new Error("create_playbook_snippet requires question");
  if (!answer) throw new Error("create_playbook_snippet requires answer");

  const category = normalizePlaybookCategory(args.category);
  const aliases = typeof args.aliases === "string" ? args.aliases.trim() || null : null;
  const tags = typeof args.tags === "string" ? args.tags.trim() || null : null;
  const pinned = args.pinned === true;

  const maxOrder = await prisma.adminPlaybookSnippet.aggregate({
    where: { category },
    _max: { sortOrder: true },
  });

  const snippet = await prisma.adminPlaybookSnippet.create({
    data: {
      question,
      answer,
      category,
      aliases,
      tags,
      pinned,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      createdById: userId,
    },
  });

  return serializeAgentPlaybookSnippet(snippet);
}

export async function updatePlaybookSnippetForAgent(args: Record<string, unknown>) {
  const existing = await findPlaybookSnippet(args);
  if (!existing) {
    throw new Error("Playbook snippet not found — provide snippet_id or snippet_question");
  }

  const data: {
    question?: string;
    answer?: string;
    category?: string;
    aliases?: string | null;
    tags?: string | null;
    pinned?: boolean;
  } = {};

  if (args.question !== undefined) {
    const question = typeof args.question === "string" ? args.question.trim() : "";
    if (!question) throw new Error("question cannot be empty");
    data.question = question;
  }

  if (args.answer !== undefined) {
    const answer = typeof args.answer === "string" ? args.answer.trim() : "";
    if (!answer) throw new Error("answer cannot be empty");
    data.answer = answer;
  }

  if (args.category !== undefined) {
    data.category = normalizePlaybookCategory(args.category);
  }

  if (args.aliases !== undefined) {
    data.aliases = typeof args.aliases === "string" ? args.aliases.trim() || null : null;
  }

  if (args.tags !== undefined) {
    data.tags = typeof args.tags === "string" ? args.tags.trim() || null : null;
  }

  if (args.pinned !== undefined) {
    data.pinned = Boolean(args.pinned);
  }

  const snippet = await prisma.adminPlaybookSnippet.update({
    where: { id: existing.id },
    data,
  });

  return serializeAgentPlaybookSnippet(snippet);
}
