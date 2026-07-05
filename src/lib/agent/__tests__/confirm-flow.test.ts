import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { needsConfirmationWithToken } from "../confirm-flow";

describe("confirm-flow", () => {
  it("returns preview with token when confirm is not true", () => {
    const preview = needsConfirmationWithToken(
      "user-1",
      "publish_tool",
      { tool_slug: "notion", confirm: false },
      false,
      { action: "publish", message: "Publish Notion?" }
    );
    assert.ok(preview);
    assert.equal(preview?.needsConfirmation, true);
    assert.ok(preview?.confirmationToken);
  });

  it("returns null when confirm is true", () => {
    const preview = needsConfirmationWithToken(
      "user-1",
      "publish_tool",
      { tool_slug: "notion", confirm: true },
      true,
      { action: "publish" }
    );
    assert.equal(preview, null);
  });
});
