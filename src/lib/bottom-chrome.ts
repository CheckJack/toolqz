export const BOTTOM_CHROME_VARS = {
  cookieNotice: "--cookie-notice-height",
  mobileCta: "--mobile-cta-height",
} as const;

export function setBottomChromeHeight(
  varName: (typeof BOTTOM_CHROME_VARS)[keyof typeof BOTTOM_CHROME_VARS],
  heightPx: number
) {
  document.documentElement.style.setProperty(varName, `${heightPx}px`);
}
