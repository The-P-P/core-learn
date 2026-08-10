import type { Transition, Variants } from "motion/react";

export const fastSpring: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 0.7,
};

export const softSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.8,
};

export const pageTransition: Transition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1],
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const staggerContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};

export function motionEnabled(reducedMotion: boolean) {
  return !reducedMotion;
}
