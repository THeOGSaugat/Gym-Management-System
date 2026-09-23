import { PageSkeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <CardSkeleton count={1} className="max-w-2xl" />
    </PageSkeleton>
  );
}
