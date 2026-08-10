import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { useThemeStore } from "../../stores/theme";

type Variant = "default" | "accent" | "success" | "warning" | "danger" | "ghost";

interface ButtonProps {
  variant?: Variant;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  "aria-label"?: string;
}

const variantClass: Record<Variant, string> = {
  default: "border-border text-fg hover:border-accent hover:text-accent",
  accent: "border-accent text-accent hover:bg-accent/10",
  success: "border-success text-success hover:bg-success/10",
  warning: "border-warning text-warning hover:bg-warning/10",
  danger: "border-danger text-danger hover:bg-danger/10",
  ghost: "border-transparent text-muted hover:text-fg hover:border-border",
};

export function Button({
  variant = "default",
  className,
  children,
  disabled,
  type = "button",
  onClick,
  ...rest
}: ButtonProps) {
  const reducedMotion = useThemeStore((s) => s.reducedMotion);

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={reducedMotion || disabled ? undefined : { scale: 0.98, y: 1 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "inline-flex h-[var(--control-h)] items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-sm transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
