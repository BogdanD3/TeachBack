import { PageSkeleton } from "@/components/PageSkeleton";

export default function CheckoutLoading() {
  return <PageSkeleton label="Loading checkout" blocks={2} />;
}
