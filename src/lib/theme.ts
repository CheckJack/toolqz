export const THEME_STORAGE_KEY = "toolqz-theme";

export function applyDarkTheme() {
  document.documentElement.setAttribute("data-theme", "dark");
  document.documentElement.style.colorScheme = "dark";
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // ignore
  }
}
