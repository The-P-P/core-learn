import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  tourTargetSelector,
  type TourPlacement,
  type TourStep,
} from "../../lib/tour-steps";
import { useThemeStore } from "../../stores/theme";
import { useTourStore } from "../../stores/tour";
import { Button } from "../ui/Button";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const PAD = 8;
const TOOLTIP_GAP = 12;
const TOOLTIP_WIDTH = 340;

function resolvePath(step: TourStep, subjectId: string | null): string {
  if (step.route === "subject") {
    return subjectId ? `/subject/${subjectId}` : "/";
  }
  return step.route;
}

async function waitForTarget(
  target: string,
  timeoutMs = 2500,
): Promise<HTMLElement | null> {
  const selector = tourTargetSelector(target);
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const el = document.querySelector(selector);
    if (el instanceof HTMLElement) return el;
    await new Promise((r) => setTimeout(r, 40));
  }
  return null;
}

function measureTarget(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

function tooltipStyle(
  placement: TourPlacement,
  hole: Rect | null,
): CSSProperties {
  if (!hole || placement === "center") {
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: `min(${TOOLTIP_WIDTH}px, calc(100vw - 2rem))`,
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = Math.max(16, vw - TOOLTIP_WIDTH - 16);
  const centerX = hole.left + hole.width / 2;

  if (placement === "bottom") {
    return {
      position: "fixed",
      top: Math.min(hole.top + hole.height + TOOLTIP_GAP, vh - 200),
      left: Math.min(Math.max(16, centerX - TOOLTIP_WIDTH / 2), maxLeft),
      width: `min(${TOOLTIP_WIDTH}px, calc(100vw - 2rem))`,
    };
  }

  if (placement === "top") {
    return {
      position: "fixed",
      bottom: Math.max(16, vh - hole.top + TOOLTIP_GAP),
      left: Math.min(Math.max(16, centerX - TOOLTIP_WIDTH / 2), maxLeft),
      width: `min(${TOOLTIP_WIDTH}px, calc(100vw - 2rem))`,
    };
  }

  if (placement === "left") {
    return {
      position: "fixed",
      top: Math.min(Math.max(16, hole.top), vh - 200),
      left: Math.max(16, hole.left - TOOLTIP_WIDTH - TOOLTIP_GAP),
      width: `min(${TOOLTIP_WIDTH}px, calc(100vw - 2rem))`,
    };
  }

  // right
  return {
    position: "fixed",
    top: Math.min(Math.max(16, hole.top), vh - 200),
    left: Math.min(hole.left + hole.width + TOOLTIP_GAP, maxLeft),
    width: `min(${TOOLTIP_WIDTH}px, calc(100vw - 2rem))`,
  };
}

export function TourOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const active = useTourStore((s) => s.active);
  const stepIndex = useTourStore((s) => s.stepIndex);
  const steps = useTourStore((s) => s.steps);
  const subjectId = useTourStore((s) => s.subjectId);
  const next = useTourStore((s) => s.next);
  const prev = useTourStore((s) => s.prev);
  const skip = useTourStore((s) => s.skip);

  const step = steps[stepIndex] ?? null;
  const [hole, setHole] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, skip]);

  useEffect(() => {
    if (!active || !step) {
      setReady(false);
      setHole(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      setReady(false);
      setHole(null);

      const path = resolvePath(step, subjectId);
      if (location.pathname !== path) {
        navigate(path);
        await new Promise((r) => setTimeout(r, reducedMotion ? 40 : 220));
      }

      if (cancelled) return;

      if (!step.target) {
        setHole(null);
        setReady(true);
        return;
      }

      const el = await waitForTarget(step.target);
      if (cancelled) return;

      if (!el) {
        setHole(null);
        setReady(true);
        return;
      }

      el.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: reducedMotion ? "auto" : "smooth",
      });
      await new Promise((r) => setTimeout(r, reducedMotion ? 40 : 180));
      if (cancelled) return;

      setHole(measureTarget(el));
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    active,
    step,
    subjectId,
    navigate,
    reducedMotion,
    location.pathname,
  ]);

  useLayoutEffect(() => {
    if (!active || !step?.target || !ready) return;

    const update = () => {
      const el = document.querySelector(tourTargetSelector(step.target!));
      if (el instanceof HTMLElement) {
        setHole(measureTarget(el));
      }
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, step, ready]);

  if (!active || !step) return null;

  const total = steps.length;
  const isLast = stepIndex >= total - 1;
  const isFirst = stepIndex <= 0;
  const tipStyle = tooltipStyle(step.placement, hole);

  return (
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
    >
      {/* Dim layer with spotlight hole */}
      {hole ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-[var(--radius-lg)] border border-accent/50"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)",
            transition: reducedMotion
              ? undefined
              : "top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease",
          }}
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-black/55"
        />
      )}

      {/* Block interaction with the app while the tour is open */}
      <div aria-hidden className="absolute inset-0" />

      <AnimatePresence mode="wait">
        {ready && (
          <motion.div
            key={step.id}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto z-[81] rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-lg"
            style={tipStyle}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
              Tour · {stepIndex + 1}/{total}
            </p>
            <h2
              id="tour-title"
              className="mt-2 font-serif text-xl font-semibold leading-snug"
            >
              {step.title}
            </h2>
            <p id="tour-body" className="mt-2 text-sm leading-relaxed text-muted">
              {step.body}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                className="h-auto px-2 py-1.5 text-xs"
                onClick={() => skip()}
              >
                Pular tour
              </Button>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  className="h-auto px-3 py-1.5 text-xs"
                  disabled={isFirst}
                  onClick={() => prev()}
                >
                  Voltar
                </Button>
                <Button
                  variant="accent"
                  className="h-auto px-3 py-1.5 text-xs"
                  onClick={() => next()}
                >
                  {isLast ? "Concluir" : "Próximo"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
