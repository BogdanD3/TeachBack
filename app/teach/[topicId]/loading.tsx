import { Pip } from "@/components/teach/Pip";

export default function TeachLoading() {
  return (
    <div className="grid h-dvh place-items-center bg-paper" aria-busy="true">
      <div className="text-center">
        <Pip state="thinking" size={96} />
        <p className="mt-4 text-ink-2">Getting Pip ready…</p>
      </div>
    </div>
  );
}
