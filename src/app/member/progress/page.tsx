import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listProgressForMember } from "@/server/services/progress.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProgressLogForm } from "@/components/progress/progress-log-form";
import { recordProgressAction } from "./actions";

export const metadata: Metadata = {
  title: "My progress",
};

const METRIC_LABELS: Record<string, string> = {
  WEIGHT_KG: "Body weight",
  BODY_FAT_PERCENT: "Body fat",
  CHEST_CM: "Chest",
  WAIST_CM: "Waist",
  HIPS_CM: "Hips",
  ARM_CM: "Arm",
  THIGH_CM: "Thigh",
};

function metricLabel(metric: string, customLabel: string | null): string {
  if (metric === "CUSTOM") return customLabel ?? "Custom";
  return METRIC_LABELS[metric] ?? metric;
}

function unit(metric: string): string {
  if (metric === "BODY_FAT_PERCENT") return "%";
  if (metric === "WEIGHT_KG") return "kg";
  if (metric.endsWith("_CM")) return "cm";
  return "";
}

export default async function MyProgressPage() {
  const actor = await requireRole("MEMBER");

  // listProgressForMember enforces "self only" — passing actor.id here
  // isn't a bypassable shortcut, it's this page's only valid call shape.
  const logs = await listProgressForMember(actor, actor.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">My progress</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Log progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressLogForm action={recordProgressAction} />
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No progress logged yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {log.recordedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>{metricLabel(log.metric, log.customLabel)}</TableCell>
                    <TableCell className="font-medium">
                      {log.value}
                      {unit(log.metric)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
