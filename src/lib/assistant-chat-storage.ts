import type { AssistantMessage } from "@/components/admin/AdminAssistantChat";

const STORAGE_KEY = "toolqz-assistant-chat";

export interface StoredAssistantChat {
  sessionId: string | null;
  messages: AssistantMessage[];
  savedAt?: number;
}

export function loadStoredAssistantChat(): StoredAssistantChat | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAssistantChat;
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredAssistantChat(data: StoredAssistantChat) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    /* quota / private mode */
  }
}

export function clearStoredAssistantChat() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
