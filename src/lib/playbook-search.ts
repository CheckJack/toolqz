const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "are",
  "we",
  "you",
  "your",
  "our",
  "us",
  "do",
  "does",
  "what",
  "how",
  "why",
  "when",
  "where",
  "can",
  "will",
  "should",
  "about",
  "tell",
  "describe",
  "please",
]);

export interface PlaybookSearchSnippet {
  id: string;
  question: string;
  answer: string;
  category: string;
  aliases: string | null;
  tags: string | null;
  pinned: boolean;
  sensitive?: boolean;
  sortOrder: number;
}

export interface PlaybookSearchResult {
  snippet: PlaybookSearchSnippet;
  score: number;
  matchReason: string | null;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function parseLines(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function wordOverlapScore(query: string, corpus: string): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;
  const corpusNorm = normalize(corpus);
  let hits = 0;
  for (const token of queryTokens) {
    if (corpusNorm.includes(token)) hits++;
  }
  return Math.round((hits / queryTokens.length) * 55);
}

export function scorePlaybookSnippet(
  snippet: PlaybookSearchSnippet,
  rawQuery: string
): PlaybookSearchResult | null {
  const query = normalize(rawQuery);
  if (!query) return null;

  const questionNorm = normalize(snippet.question);
  const answerNorm = normalize(snippet.answer);
  const aliasList = parseLines(snippet.aliases);
  const tagList = parseLines(snippet.tags);

  let score = 0;
  let matchReason: string | null = null;

  for (const alias of aliasList) {
    const aliasNorm = normalize(alias);
    if (!aliasNorm) continue;
    if (aliasNorm === query) {
      score = Math.max(score, 100);
      matchReason = `Alias: "${alias}"`;
    } else if (aliasNorm.includes(query) || query.includes(aliasNorm)) {
      score = Math.max(score, 85);
      matchReason = matchReason ?? `Alias: "${alias}"`;
    } else {
      const overlap = wordOverlapScore(rawQuery, alias);
      if (overlap >= 35) {
        score = Math.max(score, overlap + 25);
        matchReason = matchReason ?? `Alias: "${alias}"`;
      }
    }
  }

  if (questionNorm === query) {
    score = Math.max(score, 95);
    matchReason = matchReason ?? "Exact question match";
  } else if (questionNorm.includes(query) || query.includes(questionNorm)) {
    score = Math.max(score, 75);
    matchReason = matchReason ?? "Question match";
  } else {
    const qOverlap = wordOverlapScore(rawQuery, snippet.question);
    if (qOverlap > 0) {
      score = Math.max(score, qOverlap + 15);
      matchReason = matchReason ?? "Question keywords";
    }
  }

  for (const tag of tagList) {
    const tagNorm = normalize(tag);
    if (tagNorm && (query.includes(tagNorm) || tagNorm.includes(query))) {
      score = Math.max(score, 40);
      matchReason = matchReason ?? `Tag: ${tag}`;
    }
  }

  if (!snippet.sensitive) {
    if (answerNorm.includes(query)) {
      score = Math.max(score, 25);
      matchReason = matchReason ?? "Answer contains phrase";
    } else {
      const aOverlap = wordOverlapScore(rawQuery, snippet.answer);
      if (aOverlap >= 25) {
        score = Math.max(score, aOverlap);
        matchReason = matchReason ?? "Answer keywords";
      }
    }
  }

  if (snippet.pinned) score += 3;

  if (score < 18) return null;

  return { snippet, score, matchReason };
}

export function searchPlaybookSnippets(
  snippets: PlaybookSearchSnippet[],
  rawQuery: string
): PlaybookSearchResult[] {
  const query = rawQuery.trim();
  if (!query) {
    return snippets
      .slice()
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.question.localeCompare(b.question);
      })
      .map((snippet) => ({ snippet, score: 0, matchReason: null }));
  }

  return snippets
    .map((snippet) => scorePlaybookSnippet(snippet, query))
    .filter((row): row is PlaybookSearchResult => row !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.snippet.pinned !== b.snippet.pinned) return a.snippet.pinned ? -1 : 1;
      return a.snippet.question.localeCompare(b.snippet.question);
    });
}
