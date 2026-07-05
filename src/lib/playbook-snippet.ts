import {
  decryptPlaybookAnswer,
  encryptPlaybookAnswer,
  isEncryptedPlaybookAnswer,
  PLAYBOOK_MASKED_ANSWER,
} from "./playbook-secret";

export type PlaybookSnippetRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
  aliases: string | null;
  tags: string | null;
  pinned: boolean;
  sensitive: boolean;
  sortOrder: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string } | null;
};

export function preparePlaybookAnswerForStorage(answer: string, sensitive: boolean): string {
  const trimmed = answer.trim();
  if (!sensitive) return trimmed;
  return encryptPlaybookAnswer(trimmed);
}

export function readPlaybookAnswer(stored: string, sensitive: boolean): string {
  if (!sensitive) return stored;
  return decryptPlaybookAnswer(stored);
}

export function serializePlaybookSnippet(
  snippet: PlaybookSnippetRow,
  options?: { reveal?: boolean; score?: number; matchReason?: string | null }
) {
  const sensitive = snippet.sensitive;
  const reveal = options?.reveal === true;

  return {
    id: snippet.id,
    question: snippet.question,
    answer: sensitive && !reveal ? PLAYBOOK_MASKED_ANSWER : readPlaybookAnswer(snippet.answer, sensitive),
    answerHidden: sensitive && !reveal,
    sensitive,
    category: snippet.category,
    aliases: snippet.aliases,
    tags: snippet.tags,
    pinned: snippet.pinned,
    sortOrder: snippet.sortOrder,
    createdById: snippet.createdById,
    createdAt: snippet.createdAt.toISOString(),
    updatedAt: snippet.updatedAt.toISOString(),
    createdBy: snippet.createdBy,
    ...(options?.score !== undefined ? { score: options.score } : {}),
    ...(options?.matchReason !== undefined ? { matchReason: options.matchReason } : {}),
  };
}

/** Normalize stored answer when toggling sensitive off or fixing legacy rows. */
export function normalizeStoredAnswer(answer: string, sensitive: boolean): string {
  if (!sensitive) {
    if (isEncryptedPlaybookAnswer(answer)) {
      return decryptPlaybookAnswer(answer);
    }
    return answer;
  }
  if (isEncryptedPlaybookAnswer(answer)) return answer;
  return encryptPlaybookAnswer(answer);
}
