/**
 * A minimal horizontal bar breakdown (label, count, proportional bar) —
 * no charting library. This codebase avoids adding a dependency for
 * something a handful of styled `<div>`s already does clearly, matching
 * every other phase's "no unnecessary infra" precedent. Only used where a
 * proportion across a handful of categories is genuinely easier to read
 * at a glance than the same numbers in a sentence or a stat card.
 */
export function StatusBarChart({
  items,
}: {
  items: Array<{ label: string; value: number; colorClassName: string }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const percent = Math.round((item.value / total) * 100);
        return (
          <div key={item.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{item.label}</span>
              <span className="text-muted-foreground">
                {item.value} ({percent}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${item.colorClassName}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
