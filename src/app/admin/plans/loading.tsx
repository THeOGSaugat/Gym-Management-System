import { PageSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton withHeaderAction>
      <ListSkeleton rows={4} />
    </PageSkeleton>
  );
}
