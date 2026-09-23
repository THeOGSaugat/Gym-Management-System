import { cn } from "cn";

type Tone = "brand" | "success" | "warning" | "danger" | "neutral" | "muted";

const TONE_BAR: Record<Tone, string> = {
  brand: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground/60",
  muted: "bg-muted-foreground/25",
};

/**
 * A minimal horizontal breakdown — label, count, share, proportional bar.
 *
 * Deliberately not a charting library: this is the one place in the app
 * where a proportion across a handful of categories is easier to read as
 * bars than as numbers, and a few styled elements do it without adding a
 * dependency. Each row states its own count and percentage in text, so the
 * bars are a reinforcement rather than the only way to read the data.
 */
export function StatusBarChart({
  items,
}: {
  items: Array<{ label: string; value: number; tone: Tone }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No memberships recorded yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item) => {
        const percent = Math.round((item.value / total) * 100);
        return (
          <li key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {item.value}
                <span className="ml-1 text-xs">({percent}%)</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-[width]", TONE_BAR[item.tone])}
                style={{ width: `${Math.max(percent, 2)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
