import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useThemeStore } from "../stores/theme";

export type MilestoneEvent = {
  id: string;
  message: string;
} | null;

interface MilestoneCelebrationProps {
  event: MilestoneEvent;
  onDone: () => void;
}

const COLORS = [
  "var(--app-accent)",
  "var(--app-success)",
  "var(--app-warning)",
  "var(--app-danger)",
];

export function MilestoneCelebration({
  event,
  onDone,
}: MilestoneCelebrationProps) {
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const [particles, setParticles] = useState<
    { id: number; left: number; delay: number; color: string; size: number }[]
  >([]);

  useEffect(() => {
    if (!event) return;
    setParticles(
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: 20 + Math.random() * 60,
        delay: Math.random() * 0.15,
        color: COLORS[i % COLORS.length],
        size: 4 + Math.random() * 4,
      })),
    );
  }, [event]);

  useEffect(() => {
    if (!event) return;
    const t = window.setTimeout(onDone, reducedMotion ? 900 : 1400);
    return () => window.clearTimeout(t);
  }, [event, onDone, reducedMotion]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center px-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative rounded-[var(--radius-lg)] border border-accent bg-surface px-4 py-2 shadow-sm">
            <p className="font-serif text-sm font-semibold text-fg">
              {event.message}
            </p>
            {!reducedMotion &&
              particles.map((p) => (
                <span
                  key={p.id}
                  className="absolute top-0 rounded-sm"
                  style={{
                    left: `${p.left}%`,
                    width: p.size,
                    height: p.size,
                    background: p.color,
                    animation: `confetti-fall 600ms ease-out ${p.delay}s both`,
                  }}
                />
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Detect overall % threshold crossings (25/50/75/100). */
export function crossedThreshold(
  prevPct: number,
  nextPct: number,
): number | null {
  for (const t of [25, 50, 75, 100]) {
    if (prevPct < t && nextPct >= t) return t;
  }
  return null;
}
