import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  tone?: "white" | "paper";
  interactive?: boolean;
  padded?: boolean;
};

export function Card({ tone = "white", interactive = false, padded = true, className, ...rest }: Props) {
  const cls = [
    "rounded-card border border-line",
    tone === "white" ? "bg-white" : "bg-paper-2",
    padded && "p-6",
    interactive && "lift",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={cls} {...rest} />;
}
