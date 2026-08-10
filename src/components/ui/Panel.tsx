import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Panel({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface/60 p-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
