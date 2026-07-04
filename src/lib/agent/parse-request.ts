export function parseCreateToolRequest(message: string): { name?: string; url?: string } {
  const urlMatch = message.match(/https?:\/\/[^\s)\]"'<>]+/i);
  const url = urlMatch?.[0]?.replace(/[.,;]+$/, "");

  let name = message;
  if (url) name = name.replace(url, "");
  name = name
    .replace(/create\s+(a\s+)?tool\s+for\s+/i, "")
    .replace(/add\s+(a\s+)?tool\s+for\s+/i, "")
    .replace(/\s+at\s*$/i, "")
    .replace(/^[—–-]\s*|\s*[—–-]\s*$/g, "")
    .trim();

  if (!name || name.length > 80) {
    return { url };
  }

  return { name, url };
}
