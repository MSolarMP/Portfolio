import type { ComponentProps } from "react";

// Shared look for every admin button: 44px tall (touch target), visible when disabled.
const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded px-4 font-sans font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-oxblood text-seal-text hover:bg-oxblood-dark",
  secondary: "border border-bronze bg-vellum text-ink hover:bg-aged",
  ghost: "text-ink hover:bg-aged",
};

type ButtonProps = ComponentProps<"button"> & { variant?: keyof typeof variants };

/** A plain <button> with the admin styles. Defaults to type="button" so it never submits by accident. */
export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
