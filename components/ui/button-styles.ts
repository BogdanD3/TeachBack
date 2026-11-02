export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none " +
  "transition-colors duration-150 ease-out active:translate-y-px " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-coral text-white hover:bg-coral-dark",
  secondary: "border-[1.5px] border-ink text-ink bg-transparent hover:bg-paper-2",
  ghost: "text-coral-dark hover:underline underline-offset-4 px-0! active:translate-y-0",
  dark: "bg-ink text-paper hover:bg-ink/90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-[17px]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return [base, variants[variant], sizes[size], extra].filter(Boolean).join(" ");
}
