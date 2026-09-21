import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getMember } from "@/server/services/member.service";
import { handlePageError } from "@/lib/service-error";
import { toDateInputValue } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberForm } from "@/components/members/member-form";
import { updateMemberAction, setMemberStatusAction } from "../actions";

export const metadata: Metadata = {
  title: "Member details",
};

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;

  const member = await getMember(actor, id).catch(handlePageError);

  const boundUpdateAction = updateMemberAction.bind(null, member.id);
  const nextStatus = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  const toggleStatusAction = setMemberStatusAction.bind(null, member.id, nextStatus);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{member.fullName}</h1>
            <Badge variant={member.status === "ACTIVE" ? "default" : "outline"}>
              {member.status === "ACTIVE" ? "Active" : "Suspended"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Member #{member.memberProfile?.memberNumber ?? "—"} · Joined{" "}
            {(member.memberProfile?.joinDate ?? member.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stand-in for real membership status until Phase 3 adds
          MembershipPlan/Membership. Account status (active/suspended)
          is all that exists to show right now. */}
      <p className="text-sm text-muted-foreground">
        Membership plans and expiry tracking aren&apos;t built yet (Phase 3)
        — this page only reflects account status.
      </p>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Member details</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberForm
            mode="edit"
            action={boundUpdateAction}
            defaultValues={{
              fullName: member.fullName,
              email: member.email,
              phone: member.phone ?? undefined,
              dateOfBirth: toDateInputValue(member.memberProfile?.dateOfBirth),
              address: member.memberProfile?.address ?? undefined,
              emergencyContactName: member.memberProfile?.emergencyContactName ?? undefined,
              emergencyContactPhone: member.memberProfile?.emergencyContactPhone ?? undefined,
            }}
          />
        </CardContent>
      </Card>

      <Card className="max-w-2xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {member.status === "ACTIVE"
                ? "Deactivating prevents this member from logging in. Their data is kept."
                : "Reactivating allows this member to log in again."}
            </p>
            <form action={toggleStatusAction}>
              <Button type="submit" variant={member.status === "ACTIVE" ? "destructive" : "outline"}>
                {member.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
