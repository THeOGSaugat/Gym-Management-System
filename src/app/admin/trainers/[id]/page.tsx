import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getTrainer } from "@/server/services/trainer.service";
import { listAssignedMembers } from "@/server/services/assignment.service";
import { handlePageError } from "@/lib/service-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrainerForm } from "@/components/trainers/trainer-form";
import { updateTrainerAction, setTrainerStatusAction } from "../actions";

export const metadata: Metadata = {
  title: "Trainer details",
};

export default async function TrainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;

  const trainer = await getTrainer(actor, id).catch(handlePageError);
  const assignedMembers = await listAssignedMembers(actor, trainer.id);

  const boundUpdateAction = updateTrainerAction.bind(null, trainer.id);
  const nextStatus = trainer.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  const toggleStatusAction = setTrainerStatusAction.bind(null, trainer.id, nextStatus);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{trainer.fullName}</h1>
            <Badge variant={trainer.status === "ACTIVE" ? "default" : "outline"}>
              {trainer.status === "ACTIVE" ? "Active" : "Suspended"}
            </Badge>
          </div>
          {trainer.trainerProfile?.specialization && (
            <p className="text-muted-foreground">{trainer.trainerProfile.specialization}</p>
          )}
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Trainer details</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainerForm
            mode="edit"
            action={boundUpdateAction}
            defaultValues={{
              fullName: trainer.fullName,
              email: trainer.email,
              phone: trainer.phone ?? undefined,
              bio: trainer.trainerProfile?.bio ?? undefined,
              specialization: trainer.trainerProfile?.specialization ?? undefined,
              experienceYears: trainer.trainerProfile?.experienceYears ?? undefined,
            }}
          />
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Assigned members</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members currently assigned.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedMembers.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/members/${assignment.memberId}`}
                        className="hover:underline"
                      >
                        {assignment.member.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assignment.startDate.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {trainer.status === "ACTIVE"
                ? "Deactivating prevents this trainer from logging in and ends all their current assignments. Their data is kept."
                : "Reactivating allows this trainer to log in again. Their previous assignments stay ended — reassign members as needed."}
            </p>
            <form action={toggleStatusAction}>
              <Button type="submit" variant={trainer.status === "ACTIVE" ? "destructive" : "outline"}>
                {trainer.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
