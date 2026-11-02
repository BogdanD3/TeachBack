import { PageSkeleton } from "@/components/PageSkeleton";

export default function AuthLoading() {
  return <PageSkeleton label="Loading" blocks={1} width="max-w-[440px]" />;
}
