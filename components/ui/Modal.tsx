"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  id?: string;
};

/** Accessible modal built on the native <dialog> element (focus trap + Esc for free). */
export function Modal({ open, onClose, title, children, id }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      id={id}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100%-32px)] max-w-md rounded-card border border-line bg-white p-0 text-ink backdrop:bg-ink/50"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="t-h3">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-m-2 grid size-11 place-items-center rounded-full text-ink-2 hover:bg-paper-2"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
