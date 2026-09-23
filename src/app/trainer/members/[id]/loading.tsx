import { PageSkeleton, CardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <Skeleton className="h-11 w-full max-w-md rounded-lg" />
      <CardSkeleton count={2} />
    </PageSkeleton>
  );
}
