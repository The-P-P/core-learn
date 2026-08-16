import { cn } from "../lib/cn";

type LogoProps = {
  size?: number;
  className?: string;
  title?: string;
};

/** Brand mark: geometric C enclosing a luminous nucleus. */
export function Logo({
  size = 32,
  className,
  title = "Core Learn",
}: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <title>{title}</title>
      <path
        d="M44.5 16.2A22 22 0 1 0 44.5 47.8"
        stroke="#5a9e9e"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="30" cy="32" r="11" fill="#e8e4da" />
      <circle cx="33.5" cy="29.5" r="3.5" fill="#d4a054" />
    </svg>
  );
}
