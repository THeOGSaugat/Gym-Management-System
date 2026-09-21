export default function MemberDashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-56 animate-pulse rounded bg-muted" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-32 animate-pulse rounded bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
