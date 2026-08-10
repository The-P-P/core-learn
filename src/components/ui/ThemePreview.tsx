import { cn } from "../../lib/cn";
import {
  ACCENT_META,
  PALETTE_META,
  type Accent,
  type Palette,
} from "../../stores/theme";

interface ThemePreviewProps {
  palette: Palette;
  accent: Accent;
  selected?: boolean;
  onSelect: () => void;
}

export function ThemePreview({
  palette,
  accent,
  selected,
  onSelect,
}: ThemePreviewProps) {
  const meta = PALETTE_META[palette];
  const accentColor = ACCENT_META[accent].color;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex flex-col gap-2 rounded-[var(--radius-md)] border p-2 text-left transition-colors",
        selected
          ? "border-accent ring-1 ring-accent"
          : "border-border hover:border-accent/60",
      )}
    >
      <div
        data-theme={palette}
        className="theme-preview-swatch relative h-16 w-full overflow-hidden rounded-[var(--radius-md)] border border-black/10"
      >
        <div
          className="absolute inset-x-2 top-2.5 h-2 rounded-[var(--radius-sm)]"
          style={{ background: meta.swatch[1], opacity: 0.88 }}
        />
        <div
          className="absolute bottom-2.5 left-2 h-3 w-10 rounded-[var(--radius-sm)]"
          style={{ background: accentColor }}
        />
        <div
          className="absolute bottom-2.5 right-2 h-3 w-3 rounded-[var(--radius-sm)]"
          style={{ background: meta.swatch[2] }}
        />
      </div>
      <span className="font-mono text-[11px] uppercase tracking-wider text-fg">
        {meta.label}
      </span>
    </button>
  );
}
