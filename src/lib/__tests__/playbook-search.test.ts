import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scorePlaybookSnippet, searchPlaybookSnippets } from "../playbook-search";

const base = {
  id: "1",
  question: "Why should affiliates promote TOOLQZ?",
  answer: "TOOLQZ is a curated directory of software tools with SEO traffic.",
  category: "affiliate_forms",
  aliases: "why should you promote us\nwhy join your program\npromotion rationale",
  tags: "affiliate,traffic",
  pinned: false,
  sortOrder: 0,
};

describe("playbook-search", () => {
  it("matches alias phrasing for affiliate forms", () => {
    const result = scorePlaybookSnippet(base, "why should you promote us");
    assert.ok(result);
    assert.ok(result.score >= 80);
    assert.match(result.matchReason ?? "", /Alias/i);
  });

  it("matches partial question keywords", () => {
    const result = scorePlaybookSnippet(base, "promote toolqz");
    assert.ok(result);
    assert.ok(result.score >= 18);
  });

  it("returns empty ranked list for unrelated query", () => {
    const results = searchPlaybookSnippets([base], "completely unrelated xyz");
    assert.equal(results.length, 0);
  });

  it("sorts pinned first when browsing without query", () => {
    const results = searchPlaybookSnippets(
      [
        base,
        { ...base, id: "2", question: "Pinned item", pinned: true, sortOrder: 1 },
      ],
      ""
    );
    assert.equal(results[0]?.snippet.id, "2");
  });
});
