import type { ComponentPropsWithoutRef } from "react";

const sizes = {
  sm: "h-9 px-3 text-sm",
  base: "h-11 px-4 text-base",
  lg: "h-12 px-5 text-base",
};

const styles = {
  primary: {
    fill: "border border-transparent bg-brand text-inverse hover:bg-brand/90 active:bg-brand/80",
    stroke: "border border-brand text-brand hover:bg-brand/10 active:bg-brand/20",
    text: "border border-transparent text-brand hover:bg-brand/10 active:bg-brand/20",
  },
  secondary: {
    fill: "border border-transparent bg-primary text-inverse hover:bg-primary/90 active:bg-primary/80",
    stroke: "border border-line-strong text-primary hover:bg-surface active:bg-line-mild",
    text: "border border-transparent text-primary hover:bg-surface active:bg-line-mild",
  },
  destructive: {
    fill: "border border-transparent bg-red-600 text-inverse hover:bg-red-700 active:bg-red-800",
    stroke: "border border-red-600 text-red-600 hover:border-red-700 hover:text-red-700 active:border-red-800 active:text-red-800",
    text: "border border-transparent text-red-600 hover:text-red-700 active:text-red-800",
  },
};

type ButtonLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href" | "aria-disabled"> & {
  href: string;
  size?: keyof typeof sizes;
  intent?: keyof typeof styles;
  variant?: keyof typeof styles.primary;
  disabled?: boolean;
};

export function ButtonLink({
  children, href, size = "base", intent = "primary", variant = "fill",
  disabled = false, className = "", tabIndex, ...props
}: ButtonLinkProps) {
  return (
    <a
      {...props}
      href={disabled ? undefined : href}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      className={[
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-[2px] font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        sizes[size], styles[intent][variant],
        disabled ? "pointer-events-none cursor-not-allowed opacity-50" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </a>
  );
}
