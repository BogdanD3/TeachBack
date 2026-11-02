export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="t-h2 mb-6">{title}</h2>
      {children}
    </section>
  );
}
