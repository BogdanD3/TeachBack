import type { Metadata } from "next";
import { Pip } from "@/components/teach/Pip";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Highlight } from "@/components/ui/Highlight";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { InteractiveDemo } from "./InteractiveDemo";
import { Section } from "./Section";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false } };

const tokens = [
  ["--paper", "#FBF7F0", "bg-paper"],
  ["--paper-2", "#F3ECE0", "bg-paper-2"],
  ["--line", "#E2D8C7", "bg-line"],
  ["--ink", "#1E2A3A", "bg-ink"],
  ["--ink-2", "#5A6472", "bg-ink-2"],
  ["--coral", "#E4572E", "bg-coral"],
  ["--coral-dark", "#C2441F", "bg-coral-dark"],
  ["--highlight", "#FFD166", "bg-highlight"],
  ["--understood", "#2E9E6B", "bg-understood"],
  ["--shaky", "#E8A23A", "bg-shaky"],
  ["--gap", "#D64545", "bg-gap"],
  ["--teal", "#1F7A8C", "bg-teal"],
] as const;

export default function StyleguidePage() {
  return (
    <div className="gutter mx-auto max-w-content py-12">
      <p className="t-meta text-ink-2">Design system</p>
      <h1 className="t-h1 mt-2">
        The <Highlight>study desk</Highlight> kit
      </h1>
      <p className="mt-3 max-w-reading text-ink-2">Every token, font and component used on Teachback, in one place.</p>

      <Section title="Colour tokens">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {tokens.map(([name, hex, cls]) => (
            <li key={name} className="overflow-hidden rounded-card border border-line bg-white">
              <div className={`h-16 ${cls}`} />
              <div className="p-3">
                <p className="font-mono text-xs font-medium">{name}</p>
                <p className="font-mono text-xs text-ink-2">{hex}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <div className="space-y-4">
          <p className="t-display">
            Learn it by <Highlight>teaching</Highlight> it.
          </p>
          <p className="t-h1">H1 · Fraunces 600</p>
          <p className="t-h2">H2 · Fraunces 600</p>
          <p className="t-h3">H3 · Inter 600</p>
          <p className="t-body max-w-reading">
            Body · Inter 400, 16px, line-height 1.6. You explained light reactions well. Pip got lost at the Calvin cycle.
          </p>
          <p className="t-small text-ink-2">Small · Inter 400, 14px</p>
          <p className="t-meta text-ink-2">Label / meta · JetBrains Mono 500</p>
        </div>
      </Section>

      <Section title="Buttons, tabs and modal">
        <InteractiveDemo />
      </Section>

      <Section title="Inputs">
        <div className="grid gap-6 md:grid-cols-2">
          <Input id="sg-email" name="sg-email" label="Email" type="email" placeholder="you@school.edu" />
          <Input id="sg-promo" name="sg-promo" label="Promo code" defaultValue="WELCOM20" error="That code doesn't exist. Check the spelling." />
          <Textarea id="sg-note" name="sg-note" label="Your explanation" placeholder="Plants take in light and…" className="md:col-span-2" />
        </div>
      </Section>

      <Section title="Pills, badges, avatars">
        <div className="flex flex-wrap items-center gap-3">
          <Pill state="understood" />
          <Pill state="shaky" />
          <Pill state="gap" />
          <Pill state="neutral" />
          <Pill state="gap">Calvin cycle</Pill>
          <Badge>New</Badge>
          <Badge tone="teal">Live</Badge>
          <Badge tone="ink">Pro</Badge>
          <Badge tone="coral">Most popular</Badge>
          <Badge tone="outline">Demo</Badge>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Avatar name="Amara Okafor" size="lg" />
          <Avatar name="Jonas Lindqvist" />
          <Avatar name="Priya Raman" />
          <Avatar name="Mateo García" size="sm" />
          <Avatar name="Lena Fischer" size="sm" />
        </div>
      </Section>

      <Section title="Cards and skeletons">
        <div className="grid gap-6 md:grid-cols-3">
          <Card interactive>
            <p className="t-meta text-ink-2">Biology</p>
            <h3 className="t-h3 mt-2">Photosynthesis</h3>
            <p className="mt-2 text-sm text-ink-2">How plants turn light, water and CO₂ into sugar.</p>
          </Card>
          <Card tone="paper">
            <p className="t-meta text-ink-2">Paper card</p>
            <p className="mt-2 text-sm">Used for sidebars and the chat area.</p>
          </Card>
          <Card>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-6 w-3/4" />
            <Skeleton className="mt-3 h-4 w-full" />
          </Card>
        </div>
      </Section>

      <Section title="Pip">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {(["idle", "thinking", "confused", "got-it"] as const).map((s) => (
            <Card key={s} className="flex flex-col items-center">
              <Pip state={s} size={110} />
              <p className="t-meta mt-4 text-ink-2">{s}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Empty and error states">
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState title="No sessions yet" body="Pick a topic and explain it to Pip. Your gaps show up here." />
          <ErrorState />
        </div>
      </Section>
    </div>
  );
}
