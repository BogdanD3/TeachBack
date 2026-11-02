import { Pip } from "@/components/teach/Pip";

type Props = {
  title?: string;
  body?: string;
  action?: React.ReactNode;
};

export function ErrorState({
  title = "That didn't load",
  body = "Something went wrong on our side. Try again in a moment.",
  action,
}: Props) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-card border border-gap/40 bg-white px-6 py-12 text-center">
      <Pip state="confused" size={72} />
      <h3 className="t-h3 mt-4">{title}</h3>
      <p className="mt-2 max-w-sm text-ink-2">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
