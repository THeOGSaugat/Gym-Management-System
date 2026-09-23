import { PageSkeleton, Skeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <Skeleton className="h-20 rounded-xl" />
      <ListSkeleton rows={5} />
    </PageSkeleton>
  );
}
