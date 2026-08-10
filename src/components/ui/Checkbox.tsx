import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export function Checkbox({ checked, onChange, label, className }: CheckboxProps) {
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (!checked) return;
    setPop(true);
    const t = window.setTimeout(() => setPop(false), 280);
    return () => window.clearTimeout(t);
  }, [checked]);

  return (
    <label
      className={cn(
        "mt-0.5 flex cursor-pointer items-start gap-3 select-none",
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition-colors",
          checked
            ? "border-success bg-success text-white"
            : "border-border bg-surface text-transparent hover:border-accent",
          pop && "animate-check-pop",
        )}
      >
        <Check
          size={12}
          strokeWidth={3}
          className={cn(
            "transition-opacity duration-150",
            checked ? "opacity-100" : "opacity-0",
          )}
        />
      </button>
      <span
        className={cn(
          "text-sm leading-relaxed transition-all duration-200",
          checked && "text-success line-through decoration-success/40",
          pop && "translate-x-0.5",
        )}
      >
        {label}
      </span>
    </label>
  );
}
