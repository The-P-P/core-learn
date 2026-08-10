/** Read a CSS custom property from :root as a resolved color string. */
export function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export function chartColors() {
  return {
    grid: readCssVar("--app-border", "#d9d2c5"),
    accent: readCssVar("--app-accent", "#2f6e6e"),
    fg: readCssVar("--app-fg", "#16233f"),
    muted: readCssVar("--app-muted", "#16233f88"),
    surface: readCssVar("--app-surface", "#fffdf8"),
  };
}
