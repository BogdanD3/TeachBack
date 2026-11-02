import type { InputHTMLAttributes } from "react";
import { FieldError } from "./FieldError";
import { Label } from "./Label";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const inputClasses =
  "h-12 w-full rounded-card border-[1.5px] border-line bg-white px-4 text-base text-ink " +
  "placeholder:text-ink-2/70 transition-colors duration-150 " +
  "focus:border-coral focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " +
  "aria-[invalid=true]:border-gap disabled:opacity-60";

export function Input({ label, error, hint, id, className, ...rest }: Props) {
  const errId = error && id ? `${id}-error` : undefined;
  const hintId = hint && id ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <input
        id={id}
        className={inputClasses}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errId, hintId].filter(Boolean).join(" ") || undefined}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-2 text-sm text-ink-2">
          {hint}
        </p>
      )}
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
}
