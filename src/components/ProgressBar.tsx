import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { softSpring } from "../lib/motion";
import { useThemeStore } from "../stores/theme";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  pulseKey?: number | string;
}

export function ProgressBar({
  value,
  max,
  className = "",
  pulseKey,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (pulseKey === undefined) return;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 500);
    return () => window.clearTimeout(t);
  }, [pulseKey]);

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full border border-border bg-track",
        pulse && "animate-progress-pulse",
        className,
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full origin-left bg-accent"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={reducedMotion ? { duration: 0 } : softSpring}
      />
    </div>
  );
}
