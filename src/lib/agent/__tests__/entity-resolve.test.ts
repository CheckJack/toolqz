import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertUniqueMatch } from "../entity-resolve";

describe("assertUniqueMatch", () => {
  it("returns null for empty rows", () => {
    assert.equal(assertUniqueMatch([], "foo", (r: { name: string }) => r.name, "tool"), null);
  });

  it("returns single row", () => {
    const row = { id: "1", name: "Notion" };
    assert.equal(assertUniqueMatch([row], "Notion", (r) => r.name, "tool"), row);
  });

  it("picks exact match among many", () => {
    const rows = [
      { name: "Notion AI" },
      { name: "Notion" },
      { name: "Notion Calendar" },
    ];
    assert.equal(assertUniqueMatch(rows, "Notion", (r) => r.name, "tool")?.name, "Notion");
  });

  it("throws when multiple partial matches", () => {
    assert.throws(
      () =>
        assertUniqueMatch(
          [{ name: "Acme One" }, { name: "Acme Two" }],
          "Acme",
          (r) => r.name,
          "affiliate"
        ),
      /Multiple affiliates match/
    );
  });
});
