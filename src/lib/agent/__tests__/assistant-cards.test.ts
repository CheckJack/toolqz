import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cardFromConfirmation,
  cardsFromToolIssues,
  cardsFromToolList,
} from "../assistant-cards";

describe("assistant-cards", () => {
  it("cardFromConfirmation includes token when provided", () => {
    const card = cardFromConfirmation(
      {
        action: "publish",
        message: "Will publish Notion.",
        tool: { name: "Notion" },
      },
      "abc123"
    );
    assert.equal(card.type, "alert");
    if (card.type === "alert") {
      assert.equal(card.confirmPrompt?.token, "abc123");
      assert.match(card.confirmPrompt?.yes ?? "", /Notion/);
    }
  });

  it("cardsFromToolIssues adds href on issue rows", () => {
    const cards = cardsFromToolIssues({
      draftCount: 1,
      publishedNoAffiliate: {
        total: 1,
        items: [{ name: "Acme", slug: "acme", editUrl: "/admin/tools/1" }],
      },
      zeroClickPublished: { total: 0, items: [] },
      activeCrmNoUrl: { total: 0, items: [] },
    });
    const list = cards.find((c) => c.type === "ranked_list" && c.title === "Missing affiliate URL");
    assert.ok(list && list.type === "ranked_list");
    assert.equal(list.items[0]?.href, "/admin/tools/1");
  });

  it("cardsFromToolList returns info alert when empty", () => {
    const cards = cardsFromToolList({ total: 0, showing: 0, tools: [] });
    assert.equal(cards[0]?.type, "alert");
  });
});
