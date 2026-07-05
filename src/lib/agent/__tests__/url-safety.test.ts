import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertPublicHttpUrl } from "../url-safety";

describe("url-safety", () => {
  it("allows public https URLs", () => {
    const url = assertPublicHttpUrl("https://example.com/product");
    assert.equal(url.hostname, "example.com");
  });

  it("blocks localhost", () => {
    assert.throws(() => assertPublicHttpUrl("http://localhost/admin"), /not allowed/);
  });

  it("blocks private IPs", () => {
    assert.throws(() => assertPublicHttpUrl("http://192.168.1.1/"), /not allowed/);
  });

  it("blocks non-http schemes", () => {
    assert.throws(() => assertPublicHttpUrl("file:///etc/passwd"), /Only http/);
  });
});
