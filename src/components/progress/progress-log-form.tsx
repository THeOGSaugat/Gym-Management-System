"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { progressMetricValues } from "@/lib/validations/progress";

export type ProgressLogFormState = { error?: string; success?: boolean } | undefined;

const METRIC_LABELS: Record<(typeof progressMetricValues)[number], string> = {
  WEIGHT_KG: "Body weight (kg)",
  BODY_FAT_PERCENT: "Body fat (%)",
  CHEST_CM: "Chest (cm)",
  WAIST_CM: "Waist (cm)",
  HIPS_CM: "Hips (cm)",
  ARM_CM: "Arm (cm)",
  THIGH_CM: "Thigh (cm)",
  CUSTOM: "Custom metric",
};

export function ProgressLogForm({
  action,
}: {
  action: (state: ProgressLogFormState, formData: FormData) => Promise<ProgressLogFormState>;
}) {
  const [state, formAction, pending] = useActionState<ProgressLogFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="metric">Metric</Label>
          <select
            id="metric"
            name="metric"
            required
            disabled={pending}
            defaultValue="WEIGHT_KG"
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {progressMetricValues.map((metric) => (
              <option key={metric} value={metric}>
                {METRIC_LABELS[metric]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="value">Value</Label>
          <Input id="value" name="value" type="number" step="0.1" min={0} required disabled={pending} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="customLabel">Custom label (if &quot;Custom metric&quot;)</Label>
          <Input id="customLabel" name="customLabel" disabled={pending} placeholder="e.g. Resting heart rate" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="recordedAt">Date</Label>
          <Input
            id="recordedAt"
            name="recordedAt"
            type="date"
            disabled={pending}
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} disabled={pending} />
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-sm text-green-600 dark:text-green-500">
          Progress logged.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Log progress"}
        </Button>
      </div>
    </form>
  );
}
