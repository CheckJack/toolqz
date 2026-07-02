export const NEWSLETTER_SUBSCRIBED_KEY = "toolqz-newsletter-subscribed";
export const NEWSLETTER_HOME_VISITED_KEY = "toolqz-newsletter-home-visited";
export const NEWSLETTER_TOOL_INTENT_KEY = "toolqz-newsletter-tool-intent";
export const NEWSLETTER_DISMISSED_SESSION_KEY = "toolqz-newsletter-dismissed-session";
export const NEWSLETTER_SHOWN_SESSION_KEY = "toolqz-newsletter-shown-session";

/** Delay on tool page after load (ms) */
export const TOOL_PAGE_POPUP_DELAY_MS = 2500;

export function isToolDetailPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return /^\/tools\/[^/]+$/.test(pathname);
}

export function markHomepageVisited() {
  sessionStorage.setItem(NEWSLETTER_HOME_VISITED_KEY, "true");
}

export function hasVisitedHomepage(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(NEWSLETTER_HOME_VISITED_KEY) === "true";
}

export function markToolNavigationIntent() {
  sessionStorage.setItem(NEWSLETTER_TOOL_INTENT_KEY, "true");
  markHomepageVisited();
}

export function hasToolNavigationIntent(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(NEWSLETTER_TOOL_INTENT_KEY) === "true";
}

export function clearToolNavigationIntent() {
  sessionStorage.removeItem(NEWSLETTER_TOOL_INTENT_KEY);
}

export function markNewsletterShownThisSession() {
  sessionStorage.setItem(NEWSLETTER_SHOWN_SESSION_KEY, "true");
}

export function hasNewsletterShownThisSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(NEWSLETTER_SHOWN_SESSION_KEY) === "true";
}

export function isNewsletterDismissedThisSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(NEWSLETTER_DISMISSED_SESSION_KEY) === "true";
}

export function isNewsletterSubscribed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NEWSLETTER_SUBSCRIBED_KEY) === "true";
}

export function dismissNewsletterPopup() {
  sessionStorage.setItem(NEWSLETTER_DISMISSED_SESSION_KEY, "true");
  clearToolNavigationIntent();
}

export function markNewsletterSubscribed() {
  localStorage.setItem(NEWSLETTER_SUBSCRIBED_KEY, "true");
  sessionStorage.setItem(NEWSLETTER_DISMISSED_SESSION_KEY, "true");
  clearToolNavigationIntent();
}

export function shouldForceNewsletterPreview(search: string): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(search).get("newsletter") === "1";
}

export function canShowNewsletterOnToolPage(pathname: string | null | undefined): boolean {
  if (!isToolDetailPath(pathname)) return false;
  if (!hasVisitedHomepage() && !hasToolNavigationIntent()) return false;
  if (isNewsletterSubscribed()) return false;
  if (isNewsletterDismissedThisSession()) return false;
  if (hasNewsletterShownThisSession()) return false;
  return true;
}
