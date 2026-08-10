import { create } from "zustand";

export const PALETTES = [
  "papel",
  "noite",
  "pergaminho",
  "floresta",
  "oceano",
  "ardosia",
  "rosa-noite",
  "alto-contraste",
] as const;

export const ACCENTS = ["teal", "azul", "verde", "ambar", "rosa"] as const;

export const DENSITIES = ["comfortable", "compact"] as const;

export type Palette = (typeof PALETTES)[number];
export type Accent = (typeof ACCENTS)[number];
export type Density = (typeof DENSITIES)[number];

export const PALETTE_META: Record<
  Palette,
  { label: string; swatch: [string, string, string]; dark: boolean }
> = {
  papel: {
    label: "Papel",
    swatch: ["#f3eee3", "#16233f", "#2f6e6e"],
    dark: false,
  },
  noite: {
    label: "Noite",
    swatch: ["#0b101c", "#e8e4da", "#5a9e9e"],
    dark: true,
  },
  pergaminho: {
    label: "Pergaminho",
    swatch: ["#e9d8b8", "#3a2a1a", "#8b5e3c"],
    dark: false,
  },
  floresta: {
    label: "Floresta",
    swatch: ["#e2ebe3", "#1a2e24", "#3d6b4f"],
    dark: false,
  },
  oceano: {
    label: "Oceano",
    swatch: ["#e2ebf3", "#152536", "#3a6d9a"],
    dark: false,
  },
  ardosia: {
    label: "Ardósia",
    swatch: ["#e6e8ec", "#1c1f26", "#5c6578"],
    dark: false,
  },
  "rosa-noite": {
    label: "Rosa noite",
    swatch: ["#16101c", "#ebe4ec", "#c48b9f"],
    dark: true,
  },
  "alto-contraste": {
    label: "Alto contraste",
    swatch: ["#ffffff", "#000000", "#005fcc"],
    dark: false,
  },
};

export const ACCENT_META: Record<Accent, { label: string; color: string }> = {
  teal: { label: "Teal", color: "#2f6e6e" },
  azul: { label: "Azul", color: "#3a6d9a" },
  verde: { label: "Verde", color: "#3d6b4f" },
  ambar: { label: "Âmbar", color: "#c98a3b" },
  rosa: { label: "Rosa", color: "#b86b84" },
};

const STORAGE_KEY = "core-learn-appearance";
const LEGACY_KEY = "core-learn-theme";

export interface AppearanceState {
  palette: Palette;
  accent: Accent;
  density: Density;
  reducedMotion: boolean;
  setPalette: (palette: Palette) => void;
  setAccent: (accent: Accent) => void;
  setDensity: (density: Density) => void;
  hydrate: () => void;
}

function isPalette(v: unknown): v is Palette {
  return typeof v === "string" && (PALETTES as readonly string[]).includes(v);
}

function isAccent(v: unknown): v is Accent {
  return typeof v === "string" && (ACCENTS as readonly string[]).includes(v);
}

function isDensity(v: unknown): v is Density {
  return typeof v === "string" && (DENSITIES as readonly string[]).includes(v);
}

export function applyAppearance(
  palette: Palette,
  accent: Accent,
  density: Density,
) {
  const root = document.documentElement;
  root.setAttribute("data-theme", palette);
  root.setAttribute("data-accent", accent);
  root.setAttribute("data-density", density);
  root.classList.toggle("dark", PALETTE_META[palette].dark);
}

function readStored(): { palette: Palette; accent: Accent; density: Density } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        palette: isPalette(parsed.palette) ? parsed.palette : "papel",
        accent: isAccent(parsed.accent) ? parsed.accent : "teal",
        density: isDensity(parsed.density) ? parsed.density : "comfortable",
      };
    }
  } catch {
    /* ignore */
  }

  // Migrate legacy light/dark
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === "dark") {
    return { palette: "noite", accent: "teal", density: "comfortable" };
  }
  return { palette: "papel", accent: "teal", density: "comfortable" };
}

function persist(palette: Palette, accent: Accent, density: Density) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ palette, accent, density }),
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const useThemeStore = create<AppearanceState>((set, get) => ({
  palette: "papel",
  accent: "teal",
  density: "comfortable",
  reducedMotion: false,
  setPalette: (palette) => {
    const { accent, density } = get();
    persist(palette, accent, density);
    applyAppearance(palette, accent, density);
    set({ palette });
  },
  setAccent: (accent) => {
    const { palette, density } = get();
    persist(palette, accent, density);
    applyAppearance(palette, accent, density);
    set({ accent });
  },
  setDensity: (density) => {
    const { palette, accent } = get();
    persist(palette, accent, density);
    applyAppearance(palette, accent, density);
    set({ density });
  },
  hydrate: () => {
    const { palette, accent, density } = readStored();
    applyAppearance(palette, accent, density);
    set({
      palette,
      accent,
      density,
      reducedMotion: prefersReducedMotion(),
    });

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => set({ reducedMotion: mq.matches });
    mq.addEventListener("change", onChange);
  },
}));
