import { PageSkeleton } from "@/components/PageSkeleton";

export default function ThreadLoading() {
  return <PageSkeleton label="Loading thread" blocks={3} width="max-w-reading" />;
}
