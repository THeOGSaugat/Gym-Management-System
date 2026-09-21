import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listAssignedMembers } from "@/server/services/assignment.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "My members",
};

export default async function TrainerAssignedMembersPage() {
  const actor = await requireRole("TRAINER");

  // listAssignedMembers enforces "self only" itself (canViewTrainerRoster)
  // — passing actor.id here isn't a bypassable shortcut, it's the only
  // roster this page is capable of requesting.
  const assignments = await listAssignedMembers(actor, actor.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My members</h1>
        <p className="text-muted-foreground">
          {assignments.length} assigned member{assignments.length === 1 ? "" : "s"}
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          No members are currently assigned to you.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Member #</TableHead>
                <TableHead>Assigned since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/trainer/members/${assignment.memberId}`}
                      className="hover:underline"
                    >
                      {assignment.member.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {assignment.member.memberProfile?.memberNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {assignment.startDate.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
