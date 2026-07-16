import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTrackedRedirectUrl,
  extractSourcePage,
  hashIp,
  isLikelyBot,
  parseClickContext,
  parseUtmFromUrl,
} from "../click-tracking";

describe("click-tracking", () => {
  it("detects common bot user agents", () => {
    assert.equal(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
    assert.equal(isLikelyBot("facebookexternalhit/1.1"), true);
    assert.equal(
      isLikelyBot(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
      ),
      false
    );
  });

  it("parses utm params from urls", () => {
    const utm = parseUtmFromUrl(
      "https://toolqz.com/go/notion?utm_source=newsletter&utm_medium=email&utm_campaign=weekly"
    );
    assert.equal(utm.utmSource, "newsletter");
    assert.equal(utm.utmMedium, "email");
    assert.equal(utm.utmCampaign, "weekly");
  });

  it("extracts internal source page from referrer", () => {
    assert.equal(extractSourcePage("https://toolqz.com/tools/notion"), "/tools/notion");
    assert.equal(extractSourcePage("https://www.toolqz.com/blog/notion-review"), "/blog/notion-review");
    assert.equal(extractSourcePage("https://google.com/"), null);
  });

  it("hashes ip consistently", () => {
    assert.equal(hashIp("1.2.3.4"), hashIp("1.2.3.4"));
    assert.notEqual(hashIp("1.2.3.4"), hashIp("5.6.7.8"));
    assert.equal(hashIp(null), null);
  });

  it("builds tracked affiliate redirect without overwriting existing params", () => {
    const out = buildTrackedRedirectUrl(
      "https://partner.example/a?subid=existing&utm_source=partner",
      "clk_abc123",
      "notion",
      "AFFILIATE"
    );
    const url = new URL(out);
    assert.equal(url.searchParams.get("tqz_click"), "clk_abc123");
    assert.equal(url.searchParams.get("utm_source"), "partner");
    assert.equal(url.searchParams.get("utm_medium"), "affiliate");
    assert.equal(url.searchParams.get("utm_campaign"), "notion");
  });

  it("adds default affiliate utms when missing", () => {
    const out = buildTrackedRedirectUrl(
      "https://partner.example/signup",
      "clk_xyz",
      "todoist",
      "AFFILIATE"
    );
    const url = new URL(out);
    assert.equal(url.searchParams.get("tqz_click"), "clk_xyz");
    assert.equal(url.searchParams.get("utm_source"), "toolqz");
    assert.equal(url.searchParams.get("utm_medium"), "affiliate");
    assert.equal(url.searchParams.get("utm_campaign"), "todoist");
  });

  it("skips affiliate utms for editorial listings but still adds click id", () => {
    const out = buildTrackedRedirectUrl("https://example.com", "clk_ed", "example", "EDITORIAL");
    const url = new URL(out);
    assert.equal(url.searchParams.get("tqz_click"), "clk_ed");
    assert.equal(url.searchParams.get("utm_source"), null);
  });

  it("prefers request utm over referrer utm", () => {
    const ctx = parseClickContext({
      slug: "notion",
      referrer: "https://toolqz.com/tools/notion?utm_source=organic",
      userAgent: "Mozilla/5.0",
      ip: "1.2.3.4",
      requestUrl: "https://toolqz.com/go/notion?utm_source=newsletter&utm_medium=email",
    });
    assert.equal(ctx.utmSource, "newsletter");
    assert.equal(ctx.utmMedium, "email");
    assert.equal(ctx.sourcePage, "/tools/notion");
    assert.equal(ctx.isBot, false);
    assert.ok(ctx.ipHash);
  });
});
