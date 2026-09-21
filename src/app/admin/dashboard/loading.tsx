export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-56 animate-pulse rounded bg-muted" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-32 animate-pulse rounded bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
