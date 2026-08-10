import { FileText, LayoutDashboard, Settings } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "../lib/cn";
import { pageTransition, pageVariants } from "../lib/motion";
import { useThemeStore } from "../stores/theme";
import { useTourStore } from "../stores/tour";
import { TourOverlay } from "./Tour/TourOverlay";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/notes", label: "Resumos", icon: FileText },
  { to: "/settings", label: "Configurações", icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const hydrateTour = useTourStore((s) => s.hydrate);
  const hasCompleted = useTourStore((s) => s.hasCompleted);
  const hydrated = useTourStore((s) => s.hydrated);
  const active = useTourStore((s) => s.active);
  const startTour = useTourStore((s) => s.start);
  const autoStarted = useRef(false);

  useEffect(() => {
    hydrateTour();
  }, [hydrateTour]);

  useEffect(() => {
    if (!hydrated || hasCompleted || active || autoStarted.current) return;
    autoStarted.current = true;
    void startTour();
  }, [hydrated, hasCompleted, active, startTour]);

  return (
    <div className="app-shell min-h-full text-fg">
      <header className="app-header sticky top-0 z-30 border-b border-border bg-surface/55 backdrop-blur-xl">
        <div
          className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6"
          style={{ paddingBlock: "calc(var(--space-page) * 0.65)" }}
        >
          <Link
            to="/"
            className="font-serif text-3xl font-semibold leading-none tracking-tight text-fg transition-opacity hover:opacity-80 sm:text-4xl"
          >
            Core Learn
          </Link>
          <nav data-tour="nav" className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-fg"
                      : "text-muted hover:bg-track hover:text-fg",
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main
        className="mx-auto max-w-6xl px-6"
        style={{ paddingBlock: "var(--space-page)" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={reducedMotion ? undefined : pageVariants}
            initial={reducedMotion ? false : "initial"}
            animate="animate"
            exit={reducedMotion ? undefined : "exit"}
            transition={pageTransition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <TourOverlay />
    </div>
  );
}
