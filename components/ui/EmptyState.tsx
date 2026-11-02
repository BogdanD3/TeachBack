import { Pip } from "@/components/teach/Pip";

type Props = {
  title: string;
  body?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, body, action }: Props) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line bg-paper-2/60 px-6 py-12 text-center">
      <Pip state="idle" size={72} />
      <h3 className="t-h3 mt-4">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-ink-2">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
