import { AlertCircle } from "lucide-react";

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 flex items-center gap-1 text-sm text-gap">
      <AlertCircle className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
