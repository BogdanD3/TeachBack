import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, [fullWidth && "w-full", className].filter(Boolean).join(" "))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
