export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const GA_CONSENT_EVENT = "toolqz-cookie-consent";

export function isGaEnabled() {
  return /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);
}

export function dispatchAnalyticsConsent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GA_CONSENT_EVENT));
}
