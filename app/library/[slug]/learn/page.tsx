import { AlertCircle, ArrowLeft, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pip } from "@/components/teach/Pip";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ErrorState } from "@/components/ui/ErrorState";
import type { PrimerDepth } from "@/lib/ai-types";
import { getCurrentUser } from "@/lib/auth";
import { clientIp } from "@/lib/client-ip";
import { Markdown } from "@/lib/markdown";
import { getPrimer, readMinutes } from "@/lib/primer";
import { findTopic } from "@/lib/topics";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ depth?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const topic = await findTopic((await params).slug);
  const full = (await searchParams).depth === "full";
  return topic ? { title: `${full ? "Learn from scratch" : "Primer"}: ${topic.title}`, description: `Learn ${topic.title} before you teach it to Pip.` } : { title: "Topic not found" };
}

const pad = (i: number) => String(i + 1).padStart(2, "0");

export default async function PrimerPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const depth: PrimerDepth = (await searchParams).depth === "full" ? "full" : "quick";
  const topic = await findTopic(slug);
  if (!topic) notFound();
  const user = await getCurrentUser();
  const rateKey = user ? user.id : `ip:${clientIp(await headers())}`;
  const result = await getPrimer(topic, depth, rateKey);
  const otherHref = depth === "full" ? `/library/${topic.slug}/learn` : `/library/${topic.slug}/learn?depth=full`;

  if (!result.primer) {
    return (
      <div className="gutter mx-auto max-w-reading py-12">
        <ErrorState
          title="The primer isn't ready"
          body={result.failure}
          action={<ButtonLink href={`/library/${topic.slug}/learn${depth === "full" ? "?depth=full" : ""}`}>Try again</ButtonLink>}
        />
      </div>
    );
  }
  const p = result.primer;

  return (
    <article className="gutter mx-auto max-w-reading py-8 md:py-12">
      <Link href={`/library/${topic.slug}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {topic.title}
      </Link>
      <p className="t-meta mt-4 text-ink-2">
        {depth === "full" ? "From scratch" : "Primer"} · {readMinutes(p)} min read{result.source === "demo" && " · demo mode"}
      </p>
      <h1 className="t-h1 mt-2">{p.title}</h1>
      <p className="mt-4 text-lg">{p.intro}</p>

      <nav aria-labelledby="primer-contents" className="mt-8 rounded-card border border-line bg-white p-4 md:p-6">
        <h2 id="primer-contents" className="t-meta text-ink-2">
          In this primer
        </h2>
        <ol className="mt-2">
          {p.concepts.map((c, i) => (
            <li key={c.name}>
              <a href={`#concept-${i + 1}`} className="flex min-h-11 items-center gap-3 underline-offset-4 hover:underline">
                <span className="t-meta text-ink-2">{pad(i)}</span>
                {c.name}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {p.concepts.map((c, i) => (
        <section key={c.name} id={`concept-${i + 1}`} aria-labelledby={`concept-${i + 1}-h`} className="mt-12 scroll-mt-24">
          <p className="t-meta text-coral-dark">{pad(i)}</p>
          <h2 id={`concept-${i + 1}-h`} className="t-h2 mt-1">
            {c.name}
          </h2>
          <Markdown source={c.explanation} className="mt-4 text-[17px] leading-[1.7]" />
          {c.example && (
            <aside className="mt-6 flex gap-3 rounded-card border border-line bg-paper-2 p-4 md:p-6" aria-label={`Example: ${c.name}`}>
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-coral-dark" aria-hidden />
              <div>
                <p className="t-meta text-ink-2">Example</p>
                <p className="mt-1">{c.example}</p>
              </div>
            </aside>
          )}
          {c.deeper && (
            <div className="mt-6">
              <h3 className="t-h3">Going deeper</h3>
              <Markdown source={c.deeper} className="mt-2" />
            </div>
          )}
          {c.mistake && (
            <p className="mt-4 flex gap-3 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-gap" aria-hidden />
              <span>
                <strong>Common mistake:</strong> {c.mistake}
              </span>
            </p>
          )}
        </section>
      ))}

      {p.recap && (
        <div className="mt-12 rounded-card bg-highlight p-4 md:p-6">
          <p className="t-meta">Recap</p>
          <p className="mt-1 font-semibold">{p.recap}</p>
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-4 rounded-card border border-line bg-white p-6 text-center sm:flex-row sm:text-left">
        <Pip state="got-it" size={88} />
        <div className="flex-1">
          <p className="t-h3">Ready? Pip still has no idea.</p>
          <p className="mt-1 text-sm text-ink-2">Explain it in your own words. Stuck? Use Peek for a hint (5 points).</p>
        </div>
        <ButtonLink href={`/teach/${topic.slug}`} data-action="start_teach" className="shrink-0">
          Now teach it to Pip
        </ButtonLink>
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href={otherHref} className="inline-flex min-h-11 items-center font-medium text-coral-dark underline-offset-4 hover:underline" data-action={depth === "full" ? "open_primer" : "open_primer_full"}>
          {depth === "full" ? "Short on time? Read the quick version" : "Want more detail? Learn it from scratch"}
        </Link>
      </p>
    </article>
  );
}
