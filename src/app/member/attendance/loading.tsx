import { PageSkeleton, ListSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <Skeleton className="h-36 rounded-xl sm:h-32" />
      <ListSkeleton rows={5} />
    </PageSkeleton>
  );
}
