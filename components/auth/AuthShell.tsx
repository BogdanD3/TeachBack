import { Pip } from "@/components/teach/Pip";

export function AuthShell({ title, subtitle, children, aside }: { title: React.ReactNode; subtitle: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="gutter mx-auto grid max-w-content gap-12 py-12 md:grid-cols-[1fr_minmax(0,440px)] md:py-24">
      <div className="hidden flex-col justify-center md:flex">
        <Pip state="idle" size={140} />
        {aside}
      </div>
      <div>
        <h1 className="t-h1">{title}</h1>
        <p className="mt-2 text-ink-2">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
