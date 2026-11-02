import type { LabelHTMLAttributes } from "react";

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={["mb-2 block text-sm font-semibold text-ink", className].filter(Boolean).join(" ")} {...rest} />;
}
