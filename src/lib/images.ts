const LOCAL_IMAGE_PREFIXES = ["/", "data:"];

export function isLocalImage(src: string): boolean {
  return LOCAL_IMAGE_PREFIXES.some((prefix) => src.startsWith(prefix));
}

/** Whether Next.js image optimization can handle this URL (local paths or https remotes). */
export function canOptimizeImage(src: string): boolean {
  if (!src) return false;
  if (isLocalImage(src)) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
