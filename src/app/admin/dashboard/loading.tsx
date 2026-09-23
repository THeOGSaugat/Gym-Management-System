import { PageSkeleton, StatGridSkeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton withHeaderAction>
      <StatGridSkeleton />
      <CardSkeleton count={2} className="lg:grid-cols-2" />
    </PageSkeleton>
  );
}
