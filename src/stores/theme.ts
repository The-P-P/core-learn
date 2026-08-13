import { create } from "zustand";

export const ACCENTS = [
  "teal",
  "azul",
  "verde",
  "ambar",
  "rosa",
  "violeta",
  "coral",
  "lima",
  "cinza",
] as const;

export const DENSITIES = ["spacious", "comfortable", "compact", "dense"] as const;

export const BUILTIN_BACKGROUNDS = [
  "spirit-tree",
  "neon-drift",
  "gargantua",
] as const;

export type Accent = (typeof ACCENTS)[number];
export type Density = (typeof DENSITIES)[number];
export type BuiltinBackground = (typeof BUILTIN_BACKGROUNDS)[number];
export type BackgroundId = "none" | BuiltinBackground | `custom:${string}`;

export type CustomBackgroundKind = "image" | "video";

export interface CustomBackground {
  id: string;
  name: string;
  kind: CustomBackgroundKind;
  path: string;
}

export const ACCENT_META: Record<Accent, { label: string; color: string }> = {
  teal: { label: "Teal", color: "#5a9e9e" },
  azul: { label: "Azul", color: "#6a9fd4" },
  verde: { label: "Verde", color: "#6ab08a" },
  ambar: { label: "Âmbar", color: "#e0a85a" },
  rosa: { label: "Rosa", color: "#d494ac" },
  violeta: { label: "Violeta", color: "#a78bdb" },
  coral: { label: "Coral", color: "#e08a7a" },
  lima: { label: "Lima", color: "#8fc45e" },
  cinza: { label: "Cinza", color: "#9ca3af" },
};

export const DENSITY_META: Record<Density, { label: string }> = {
  spacious: { label: "Espaçoso" },
  comfortable: { label: "Confortável" },
  compact: { label: "Compacto" },
  dense: { label: "Denso" },
};

export const BUILTIN_BACKGROUND_META: Record<
  BuiltinBackground,
  { label: string; video: string; thumb: string }
> = {
  "spirit-tree": {
    label: "Árvore espírito",
    video: "/backgrounds/spirit-tree.mp4",
    thumb: "/backgrounds/spirit-tree-thumb.jpg",
  },
  "neon-drift": {
    label: "Neon drift",
    video: "/backgrounds/neon-drift.mp4",
    thumb: "/backgrounds/neon-drift-thumb.jpg",
  },
  gargantua: {
    label: "Gargantua",
    video: "/backgrounds/gargantua.mp4",
    thumb: "/backgrounds/gargantua-thumb.jpg",
  },
};

const STORAGE_KEY = "core-learn-appearance";
const DEFAULT_DIM = 0.55;
const MIN_DIM = 0.35;
const MAX_DIM = 0.75;
const DEFAULT_BACKGROUND: BackgroundId = "spirit-tree";

export interface AppearanceState {
  accent: Accent;
  density: Density;
  backgroundId: BackgroundId;
  backgroundDim: number;
  customBackgrounds: CustomBackground[];
  reducedMotion: boolean;
  setAccent: (accent: Accent) => void;
  setDensity: (density: Density) => void;
  setBackgroundId: (backgroundId: BackgroundId) => void;
  setBackgroundDim: (backgroundDim: number) => void;
  addCustomBackground: (bg: CustomBackground) => void;
  removeCustomBackground: (id: string) => void;
  hydrate: () => void;
}

function isAccent(v: unknown): v is Accent {
  return typeof v === "string" && (ACCENTS as readonly string[]).includes(v);
}

function isDensity(v: unknown): v is Density {
  return typeof v === "string" && (DENSITIES as readonly string[]).includes(v);
}

function isBuiltinBackground(v: unknown): v is BuiltinBackground {
  return (
    typeof v === "string" &&
    (BUILTIN_BACKGROUNDS as readonly string[]).includes(v)
  );
}

function isBackgroundId(
  v: unknown,
  customs: CustomBackground[],
): v is BackgroundId {
  if (v === "none") return true;
  if (isBuiltinBackground(v)) return true;
  if (typeof v === "string" && v.startsWith("custom:")) {
    const id = v.slice("custom:".length);
    return customs.some((c) => c.id === id);
  }
  return false;
}

function clampDim(v: unknown): number {
  if (typeof v !== "number" || Number.isNaN(v)) return DEFAULT_DIM;
  return Math.min(MAX_DIM, Math.max(MIN_DIM, v));
}

function isCustomBackground(v: unknown): v is CustomBackground {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    (o.kind === "image" || o.kind === "video") &&
    typeof o.path === "string"
  );
}

export function applyAppearance(accent: Accent, density: Density) {
  const root = document.documentElement;
  root.setAttribute("data-accent", accent);
  root.setAttribute("data-density", density);
  root.classList.add("dark");
  root.removeAttribute("data-theme");
}

interface StoredAppearance {
  accent: Accent;
  density: Density;
  backgroundId: BackgroundId;
  backgroundDim: number;
  customBackgrounds: CustomBackground[];
}

function readStored(): StoredAppearance {
  const defaults: StoredAppearance = {
    accent: "teal",
    density: "comfortable",
    backgroundId: DEFAULT_BACKGROUND,
    backgroundDim: DEFAULT_DIM,
    customBackgrounds: [],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const customBackgrounds = Array.isArray(parsed.customBackgrounds)
        ? parsed.customBackgrounds.filter(isCustomBackground)
        : [];
      const backgroundId = isBackgroundId(parsed.backgroundId, customBackgrounds)
        ? parsed.backgroundId
        : // Migrate: old installs with no background → default video
          parsed.backgroundId === "none"
          ? "none"
          : DEFAULT_BACKGROUND;
      return {
        accent: isAccent(parsed.accent) ? parsed.accent : defaults.accent,
        density: isDensity(parsed.density) ? parsed.density : defaults.density,
        backgroundId,
        backgroundDim: clampDim(parsed.backgroundDim),
        customBackgrounds,
      };
    }
  } catch {
    /* ignore */
  }

  return defaults;
}

function persist(state: StoredAppearance) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accent: state.accent,
      density: state.density,
      backgroundId: state.backgroundId,
      backgroundDim: state.backgroundDim,
      customBackgrounds: state.customBackgrounds,
    }),
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const useThemeStore = create<AppearanceState>((set, get) => ({
  accent: "teal",
  density: "comfortable",
  backgroundId: DEFAULT_BACKGROUND,
  backgroundDim: DEFAULT_DIM,
  customBackgrounds: [],
  reducedMotion: false,
  setAccent: (accent) => {
    const { density, backgroundId, backgroundDim, customBackgrounds } = get();
    persist({
      accent,
      density,
      backgroundId,
      backgroundDim,
      customBackgrounds,
    });
    applyAppearance(accent, density);
    set({ accent });
  },
  setDensity: (density) => {
    const { accent, backgroundId, backgroundDim, customBackgrounds } = get();
    persist({
      accent,
      density,
      backgroundId,
      backgroundDim,
      customBackgrounds,
    });
    applyAppearance(accent, density);
    set({ density });
  },
  setBackgroundId: (backgroundId) => {
    const { accent, density, backgroundDim, customBackgrounds } = get();
    persist({
      accent,
      density,
      backgroundId,
      backgroundDim,
      customBackgrounds,
    });
    set({ backgroundId });
  },
  setBackgroundDim: (backgroundDim) => {
    const dim = clampDim(backgroundDim);
    const { accent, density, backgroundId, customBackgrounds } = get();
    persist({
      accent,
      density,
      backgroundId,
      backgroundDim: dim,
      customBackgrounds,
    });
    set({ backgroundDim: dim });
  },
  addCustomBackground: (bg) => {
    const { accent, density, backgroundDim, customBackgrounds } = get();
    const next = [...customBackgrounds.filter((c) => c.id !== bg.id), bg];
    const backgroundId: BackgroundId = `custom:${bg.id}`;
    persist({
      accent,
      density,
      backgroundId,
      backgroundDim,
      customBackgrounds: next,
    });
    set({ customBackgrounds: next, backgroundId });
  },
  removeCustomBackground: (id) => {
    const {
      accent,
      density,
      backgroundId,
      backgroundDim,
      customBackgrounds,
    } = get();
    const next = customBackgrounds.filter((c) => c.id !== id);
    const nextBackgroundId: BackgroundId =
      backgroundId === `custom:${id}` ? DEFAULT_BACKGROUND : backgroundId;
    persist({
      accent,
      density,
      backgroundId: nextBackgroundId,
      backgroundDim,
      customBackgrounds: next,
    });
    set({ customBackgrounds: next, backgroundId: nextBackgroundId });
  },
  hydrate: () => {
    const stored = readStored();
    applyAppearance(stored.accent, stored.density);
    set({
      ...stored,
      reducedMotion: prefersReducedMotion(),
    });

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => set({ reducedMotion: mq.matches });
    mq.addEventListener("change", onChange);
  },
}));
