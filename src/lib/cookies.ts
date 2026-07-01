export const COOKIE_CONSENT_KEY = "toolqz-cookie-consent";

export type CookieConsent = "accepted";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  return value === "accepted" ? "accepted" : null;
}

export function setCookieConsent() {
  localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
}
