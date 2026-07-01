export const NEWSLETTER_DISMISSED_KEY = "toolqz-newsletter-dismissed";
export const NEWSLETTER_SUBSCRIBED_KEY = "toolqz-newsletter-subscribed";

export function isNewsletterDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(NEWSLETTER_DISMISSED_KEY) === "true";
}

export function isNewsletterSubscribed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NEWSLETTER_SUBSCRIBED_KEY) === "true";
}

export function dismissNewsletterPopup() {
  localStorage.setItem(NEWSLETTER_DISMISSED_KEY, "true");
}

export function markNewsletterSubscribed() {
  localStorage.setItem(NEWSLETTER_SUBSCRIBED_KEY, "true");
  localStorage.setItem(NEWSLETTER_DISMISSED_KEY, "true");
}
