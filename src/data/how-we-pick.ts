export const reviewPillars = [
  {
    title: "Tested before listing",
    body: "We try each tool ourselves and write honest overviews — not copy-pasted marketing blurbs.",
  },
  {
    title: "Pros & cons included",
    body: "Every review covers pricing, who it's for, and what we don't like. No pure hype.",
  },
  {
    title: "Affiliate transparency",
    body: "Some links earn us a commission at no extra cost to you. We still only list tools we'd recommend.",
  },
] as const;

export const reviewSteps = [
  {
    step: "01",
    title: "Discovery & shortlist",
    body: "We track tools readers ask about, spot trends in productivity and digital life, and vet whether a product solves a real problem.",
  },
  {
    step: "02",
    title: "Hands-on testing",
    body: "We sign up, use core features, check pricing pages, and note friction — the same way a careful buyer would.",
  },
  {
    step: "03",
    title: "Editorial review",
    body: "We write original copy: overview, who it's for, pros, cons, pricing breakdown, and FAQs. Marketing fluff gets cut.",
  },
  {
    step: "04",
    title: "Publish & maintain",
    body: "Listings go live with clear affiliate disclosure. We revisit tools when pricing, features, or our experience changes.",
  },
] as const;

export const weDontList = [
  "Tools we haven't personally tested or can't verify",
  "Get-rich-quick schemes, shady gambling, or misleading finance products",
  "Copy-paste directory spam with no original editorial value",
  "Products that fail basic trust signals (opaque pricing, no support, broken signup)",
] as const;
