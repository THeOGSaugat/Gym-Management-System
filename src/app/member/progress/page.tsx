import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listProgressForMember } from "@/server/services/progress.service";
import { METRIC_UNIT, metricLabel } from "@/lib/progress-display";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { ProgressLogForm } from "@/components/progress/progress-log-form";
import { ProgressSummary } from "@/components/progress/progress-summary";
import { recordProgressAction } from "./actions";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Progress",
};

export default async function MyProgressPage() {
  const actor = await requireRole("MEMBER");

  // listProgressForMember enforces "self only" — passing actor.id here
  // isn't a bypassable shortcut, it's this page's only valid call shape.
  const logs = await listProgressForMember(actor, actor.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Progress"
        description="Log your measurements and watch them change over time."
      />

      <ProgressSummary logs={logs} />

      <Card>
        <CardHeader>
          <CardTitle>Log an entry</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressLogForm action={recordProgressAction} />
        </CardContent>
      </Card>

      <Section title="History" description={logs.length > 0 ? `${logs.length} entries` : undefined}>
        {logs.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No entries yet"
            description="Log your first measurement above — weight, body fat or a body measurement."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {metricLabel(log.metric, log.customLabel)}
                  </span>
                  <span className="text-[0.8125rem] text-muted-foreground">
                    {log.recordedAt.toLocaleDateString(
                      undefined,
                      zoned({
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }),
                    )}
                  </span>
                  {log.notes ? (
                    <span className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                      {log.notes}
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 text-base font-semibold tabular-nums">
                  {log.value}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                    {METRIC_UNIT[log.metric]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
