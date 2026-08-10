import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

export type MetaTone = "danger" | "warning" | "muted" | "neutral";

export interface MetaOption<T extends string> {
  id: T;
  label: string;
  hint?: ReactNode;
}

interface MetaChipProps<T extends string> {
  value: T;
  options: MetaOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  tone?: MetaTone;
  leading?: ReactNode;
  className?: string;
}

const toneClass: Record<MetaTone, string> = {
  danger: "text-danger border-danger/35 hover:border-danger/60",
  warning: "text-warning border-warning/35 hover:border-warning/60",
  muted: "text-muted border-border hover:border-accent/50",
  neutral: "text-fg border-border hover:border-accent/50",
};

export function MetaChip<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  tone = "neutral",
  leading,
  className,
}: MetaChipProps<T>) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.id === value) ?? options[0];

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    function place() {
      const rect = buttonRef.current!.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded-[var(--radius-md)] border bg-surface/80 px-2 text-[11px] transition-colors",
          open && "border-accent text-accent",
          !open && toneClass[tone],
        )}
      >
        {leading}
        <span>{current?.label}</span>
        <ChevronDown
          size={12}
          className={cn(
            "opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className="fixed z-[200] min-w-[9.5rem] rounded-[var(--radius-lg)] border border-border bg-surface py-1 shadow-lg"
            style={{ top: coords.top, right: coords.right }}
          >
            <p className="px-2.5 pb-1 pt-1 font-mono text-[9px] uppercase tracking-wider text-muted">
              {ariaLabel}
            </p>
            {options.map((opt) => {
              const active = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-none px-2.5 py-1.5 text-left text-xs transition-colors",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-fg hover:bg-track",
                  )}
                >
                  <span className="w-3.5 shrink-0">
                    {active && <Check size={12} strokeWidth={2.5} />}
                  </span>
                  {opt.hint}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Simple 1–3 bar intensity mark for difficulty. */
export function IntensityBars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-end gap-0.5" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-sm",
            i === 1 && "h-1.5",
            i === 2 && "h-2",
            i === 3 && "h-2.5",
            i <= level ? "bg-current opacity-90" : "bg-current opacity-25",
          )}
        />
      ))}
    </span>
  );
}
