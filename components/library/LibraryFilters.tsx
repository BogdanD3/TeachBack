"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Input";

type Props = { subjects: readonly string[]; q?: string; subject?: string; difficulty?: string };

const selectCls = inputClasses + " appearance-none pr-8 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 stroke=%22%231E2A3A%22 stroke-width=%221.5%22 fill=%22none%22/></svg>')] bg-no-repeat bg-[right_14px_center]";

/** Plain GET form (works without JS); selects auto-apply when JS is on. */
export function LibraryFilters({ subjects, q, subject, difficulty }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);

  function apply() {
    const fd = new FormData(ref.current!);
    const params = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v) params.set(k, v);
    router.push(`/library${params.size ? `?${params}` : ""}`);
  }

  return (
    <form
      ref={ref}
      id="library-filter-form"
      name="library-filter-form"
      action="/library"
      method="get"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="grid gap-3 sm:grid-cols-[1fr_200px_180px_auto]"
    >
      <div className="relative">
        <label htmlFor="library-q" className="sr-only">
          Search topics
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-2" aria-hidden />
        <input id="library-q" name="q" type="search" defaultValue={q} placeholder="Search topics, e.g. vaccines" className={inputClasses + " pl-10"} />
      </div>
      <div>
        <label htmlFor="library-subject" className="sr-only">
          Subject
        </label>
        <select id="library-subject" name="subject" defaultValue={subject ?? ""} onChange={apply} className={selectCls}>
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="library-difficulty" className="sr-only">
          Difficulty
        </label>
        <select id="library-difficulty" name="difficulty" defaultValue={difficulty ?? ""} onChange={apply} className={selectCls}>
          <option value="">Any difficulty</option>
          <option value="1">Beginner</option>
          <option value="2">Intermediate</option>
          <option value="3">Advanced</option>
        </select>
      </div>
      <Button type="submit" variant="dark" data-action="library_search">
        Search
      </Button>
    </form>
  );
}
