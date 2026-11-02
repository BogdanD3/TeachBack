import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";

type Props = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function ButtonLink({ variant = "primary", size = "md", fullWidth, className, ...rest }: Props) {
  return (
    <Link
      className={buttonClasses(variant, size, [fullWidth && "w-full", className].filter(Boolean).join(" "))}
      {...rest}
    />
  );
}
