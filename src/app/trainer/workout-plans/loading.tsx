import { PageSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <ListSkeleton rows={5} />
    </PageSkeleton>
  );
}
