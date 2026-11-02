import { PageSkeleton } from "@/components/PageSkeleton";

export default function TopicLoading() {
  return <PageSkeleton label="Loading topic" blocks={3} width="max-w-content" />;
}
