import type { TextareaHTMLAttributes } from "react";
import { FieldError } from "./FieldError";
import { Label } from "./Label";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, id, className, rows = 4, ...rest }: Props) {
  const errId = error && id ? `${id}-error` : undefined;
  return (
    <div className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <textarea
        id={id}
        rows={rows}
        className={
          "w-full rounded-card border-[1.5px] border-line bg-white px-4 py-3 text-base text-ink " +
          "placeholder:text-ink-2/70 transition-colors duration-150 focus:border-coral focus:outline-none " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-[invalid=true]:border-gap"
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
        {...rest}
      />
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
}
