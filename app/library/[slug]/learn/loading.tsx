import { ProgressSteps } from "@/components/teach/ProgressSteps";

const STEPS = ["Picking out the key ideas…", "Explaining each concept simply…", "Finding everyday examples…", "Writing hints for when you get stuck…", "Almost there…"];

export default function PrimerLoading() {
  return (
    <div className="gutter mx-auto max-w-reading py-12 md:py-16">
      <ProgressSteps title="Writing your primer" steps={STEPS} />
    </div>
  );
}
