export default function AdminNotificationsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
