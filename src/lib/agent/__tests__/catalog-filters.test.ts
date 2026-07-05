import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maskSubscriberEmail, partnerMissingAffiliateWhere } from "../catalog-filters";

describe("catalog-filters", () => {
  it("partnerMissingAffiliateWhere only targets affiliate partners", () => {
    assert.equal(partnerMissingAffiliateWhere.listingType, "AFFILIATE");
    assert.equal(partnerMissingAffiliateWhere.published, true);
    assert.equal(partnerMissingAffiliateWhere.affiliateUrl, null);
  });

  it("maskSubscriberEmail hides most of the local part", () => {
    assert.equal(maskSubscriberEmail("tiago@toolqz.com"), "ti•••@toolqz.com");
    assert.equal(maskSubscriberEmail("a@b.co"), "a@b.co");
  });
});
