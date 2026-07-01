import { Website } from "@/types";

const DISCLAIMERS: Partial<
  Record<Website["category"], { title: string; body: string }>
> = {
  finance: {
    title: "Financial services notice",
    body: "TOOLQZ is not a financial advisor. Revolut and Robinhood are regulated differently by region. Investing involves risk of loss. Fees, spreads, and product availability vary. Always read official terms before depositing money or trading.",
  },
  gambling: {
    title: "Responsible gambling",
    body: "Gambling is for adults only (18+ or 21+ depending on your region). Never bet more than you can afford to lose. If gambling stops being fun, visit BeGambleAware.org or your local helpline. Availability of sportsbook and casino products depends on your location and local law.",
  },
  health: {
    title: "Health & wellness notice",
    body: "MyFitnessPal and Headspace provide general wellness tools — not medical advice, diagnosis, or treatment. Consult a qualified professional for health conditions, eating disorders, or mental health crises.",
  },
  food: {
    title: "Delivery & meal kit notes",
    body: "Menu options, delivery fees, and dietary filters vary by postcode and restaurant. Meal kits require cooking time and basic kitchen equipment. Check allergens on each recipe before ordering.",
  },
  education: {
    title: "Learning outcomes",
    body: "Certificates and degrees can strengthen a résumé but do not guarantee employment or salary outcomes. Course quality varies by instructor and institution — review syllabi and refund policies before paying.",
  },
  shopping: {
    title: "Shopping & returns",
    body: "Return windows, shipping costs, and Prime or student benefits depend on your account, region, and item category. Check the seller’s return policy at checkout — especially for marketplace third-party sellers.",
  },
};

export function CategoryDisclaimer({ category }: { category: Website["category"] }) {
  const disclaimer = DISCLAIMERS[category];
  if (!disclaimer) return null;

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
      <h3 className="mb-2 font-semibold text-neon">{disclaimer.title}</h3>
      <p className="text-sm leading-relaxed text-muted">{disclaimer.body}</p>
    </div>
  );
}
