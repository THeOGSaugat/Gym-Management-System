"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field } from "@/components/ui/form-field";
import { METRIC_LABEL, METRIC_UNIT } from "@/lib/progress-display";
import { progressMetricValues } from "@/lib/validations/progress";

export type ProgressLogFormState = { error?: string; success?: boolean } | undefined;

type Metric = (typeof progressMetricValues)[number];

export function ProgressLogForm({
  action,
}: {
  action: (state: ProgressLogFormState, formData: FormData) => Promise<ProgressLogFormState>;
}) {
  const [state, formAction, pending] = useActionState<ProgressLogFormState, FormData>(
    action,
    undefined,
  );
  // Only used to label the value field with the right unit and to explain
  // when the custom-name field applies. The field itself is always rendered,
  // so the form still works as a plain HTML submit before hydration.
  const [metric, setMetric] = useState<Metric>("WEIGHT_KG");
  const unit = METRIC_UNIT[metric];

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What are you measuring?" htmlFor="metric">
          <NativeSelect
            id="metric"
            name="metric"
            required
            disabled={pending}
            value={metric}
            onChange={(event) => setMetric(event.target.value as Metric)}
          >
            {progressMetricValues.map((value) => (
              <option key={value} value={value}>
                {value === "CUSTOM" ? "Something else" : METRIC_LABEL[value]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={unit ? `Value (${unit})` : "Value"} htmlFor="value">
          <Input
            id="value"
            name="value"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            required
            disabled={pending}
          />
        </Field>
        <Field
          label="Name"
          htmlFor="customLabel"
          optional={metric !== "CUSTOM"}
          hint={
            metric === "CUSTOM"
              ? "What you're tracking, e.g. resting heart rate."
              : "Only needed when measuring something else."
          }
          className={metric === "CUSTOM" ? undefined : "text-muted-foreground"}
        >
          <Input
            id="customLabel"
            name="customLabel"
            disabled={pending}
            placeholder="e.g. Resting heart rate"
            aria-describedby="customLabel-hint"
          />
        </Field>
        <Field label="Date" htmlFor="recordedAt">
          <Input
            id="recordedAt"
            name="recordedAt"
            type="date"
            disabled={pending}
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" optional>
        <Textarea id="notes" name="notes" rows={2} disabled={pending} />
      </Field>

      {state?.error ? <ActionFeedback tone="error">{state.error}</ActionFeedback> : null}
      {state?.success ? <ActionFeedback>Progress logged.</ActionFeedback> : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-start">
        {pending ? "Saving…" : "Log progress"}
      </Button>
    </form>
  );
}
