import { PageSkeleton } from "@/components/PageSkeleton";

export default function ProfileLoading() {
  return <PageSkeleton label="Loading profile" blocks={3} />;
}
