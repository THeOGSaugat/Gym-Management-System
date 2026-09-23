import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "cn";

/**
 * A small inline sparkline built from plain SVG — no charting library,
 * matching the same "a handful of styled elements beats a dependency"
 * precedent `StatusBarChart` set for the admin dashboard. Takes values in
 * chronological order (oldest first); a single point or a perfectly flat
 * line still renders a sensible flat/centred line rather than dividing by
 * zero.
 */
export function MetricSparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  if (values.length < 2) return null;

  const width = 100;
  const height = 28;
  const padding = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * (width - padding * 2) + padding;
    const y =
      range === 0
        ? height / 2
        : height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-7 w-full text-primary", className)}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The change since the previous entry of the same metric, stated as a
 * number with a direction icon — deliberately not colour-coded as
 * "good"/"bad": whether a rising number is progress depends on the metric
 * and the member's own goal (a rising WEIGHT_KG could be either), which
 * this app has no way to know. The icon and text only ever assert
 * direction and magnitude, never judgement.
 */
export function MetricDelta({
  current,
  previous,
  unit,
  className,
}: {
  current: number;
  previous: number;
  unit: string;
  className?: string;
}) {
  const diff = Math.round((current - previous) * 100) / 100;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const sign = diff > 0 ? "+" : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {sign}
      {diff}
      {unit} vs last
    </span>
  );
}
