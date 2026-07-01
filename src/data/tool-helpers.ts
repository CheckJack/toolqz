export function logoFor(url: string): string {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return "";
  }
}

export function screenshotsFor(name: string, count = 3): string[] {
  return Array.from({ length: count }, (_, i) => {
    const label = encodeURIComponent(`${name} — Preview ${i + 1}`);
    return `https://placehold.co/1200x675/1a1a1a/ccff02/png?font=montserrat&text=${label}`;
  });
}

export function mergeWebsite(
  base: import("@/types").WebsiteBase,
  rich: import("@/types").WebsiteRichContent
): import("@/types").Website {
  return { ...base, ...rich };
}
