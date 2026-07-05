import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildReceiptMessage } from "../pending-confirmation";

describe("pending-confirmation", () => {
  it("buildReceiptMessage formats publish", () => {
    assert.equal(
      buildReceiptMessage("publish_tool", { success: true, name: "Notion", published: true }),
      "Published Notion."
    );
  });

  it("buildReceiptMessage formats delete", () => {
    assert.equal(
      buildReceiptMessage("delete_tool", { success: true, deleted: "Old Tool" }),
      "Deleted Old Tool."
    );
  });
});
