import { PageSkeleton, StatGridSkeleton, Skeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <StatGridSkeleton count={4} />
      <Skeleton className="h-52 rounded-xl" />
      <ListSkeleton rows={4} />
    </PageSkeleton>
  );
}
