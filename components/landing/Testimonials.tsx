import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

const quotes = [
  { name: "Lena Fischer", role: "Medicine, 2nd year", text: "I was sure I understood vaccines. Pip asked what a memory cell actually remembers, and I had nothing. Fixed it in one lesson." },
  { name: "Kwame Mensah", role: "High school, final year", text: "The gap report quoted my own sentence back to me. That's when I realised I'd been saying “energy” without meaning anything." },
  { name: "Priya Raman", role: "CS bootcamp", text: "Explaining recursion to a confused blob is weirdly the best revision I've done. My study group now starts every meeting with it." },
];

export function Testimonials() {
  return (
    <section aria-labelledby="quotes-h" className="gutter mx-auto max-w-content py-16 md:py-24">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="quotes-h" className="t-h2">What learners say</h2>
        <Badge tone="outline">Demo testimonials</Badge>
      </div>
      <p className="mt-2 text-sm text-ink-2">Illustrative quotes for this hackathon demo, not real customers.</p>
      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {quotes.map((q) => (
          <li key={q.name} className="flex flex-col rounded-card border border-line bg-white p-6">
            <blockquote className="flex-1">“{q.text}”</blockquote>
            <div className="mt-6 flex items-center gap-3">
              <Avatar name={q.name} size="sm" />
              <div>
                <p className="text-sm font-semibold">{q.name}</p>
                <p className="text-xs text-ink-2">{q.role}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
