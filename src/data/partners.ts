/** Static partner logos on the partnerships page — not tied to tool listings. */
export type ShowcasePartner = {
  id: string;
  name: string;
  logoUrl: string;
};

export const showcasePartners: ShowcasePartner[] = [
  {
    id: "revolut",
    name: "Revolut",
    logoUrl: "https://cdn.simpleicons.org/revolut/ffffff",
  },
  {
    id: "kit",
    name: "Kit",
    logoUrl: "/images/partners/kit.png",
  },
  {
    id: "metricool",
    name: "Metricool",
    logoUrl: "/images/partners/metricool.png",
  },
  {
    id: "hostinger",
    name: "Hostinger",
    logoUrl: "/images/partners/hostinger.png",
  },
];
