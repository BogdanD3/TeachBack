import { ProgressSteps } from "@/components/teach/ProgressSteps";

const STEPS = ["Reading what you told Pip…", "Pinpointing what was missing…", "Finding an everyday example…", "Writing two check questions…", "Almost there…"];

export default function LessonLoading() {
  return (
    <div className="gutter mx-auto max-w-reading py-12 md:py-16">
      <ProgressSteps title="Writing a lesson for your exact gap" steps={STEPS} />
    </div>
  );
}
