import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decryptPlaybookAnswer,
  encryptPlaybookAnswer,
  isEncryptedPlaybookAnswer,
} from "../playbook-secret";

describe("playbook-secret", () => {
  it("round-trips encryption", () => {
    const prev = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "test-secret-for-playbook-encryption";

    try {
      const plain = "SuperSecretP@ssw0rd!";
      const stored = encryptPlaybookAnswer(plain);
      assert.equal(isEncryptedPlaybookAnswer(stored), true);
      assert.notEqual(stored, plain);
      assert.equal(decryptPlaybookAnswer(stored), plain);
    } finally {
      if (prev === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = prev;
    }
  });
});
