import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const PREFIX = "pb1:";
const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_SALT = "toolqz-playbook-v1";

function getEncryptionKey(): Buffer {
  const secret =
    process.env.PLAYBOOK_ENCRYPTION_KEY?.trim() || process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Sensitive playbook snippets require PLAYBOOK_ENCRYPTION_KEY or AUTH_SECRET on the server"
    );
  }
  return scryptSync(secret, KEY_SALT, 32);
}

export function isEncryptedPlaybookAnswer(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

export function encryptPlaybookAnswer(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptPlaybookAnswer(stored: string): string {
  if (!isEncryptedPlaybookAnswer(stored)) return stored;
  const buf = Buffer.from(stored.slice(PREFIX.length), "base64url");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export const PLAYBOOK_MASKED_ANSWER = "••••••••••••";
