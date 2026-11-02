import { PageSkeleton } from "@/components/PageSkeleton";

export default function NewThreadLoading() {
  return <PageSkeleton label="Loading" blocks={2} width="max-w-reading" />;
}
