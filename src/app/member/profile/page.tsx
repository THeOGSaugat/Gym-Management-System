import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getMember } from "@/server/services/member.service";
import { handlePageError } from "@/lib/service-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SelfProfileForm } from "@/components/members/self-profile-form";
import { updateOwnProfileAction } from "./actions";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function MemberProfilePage() {
  const actor = await requireRole("MEMBER");

  // getMember enforces "self only" itself (canViewMember), so passing
  // actor.id here isn't a bypassable shortcut — even if this page were
  // ever changed to accept a param, the service would still refuse.
  const member = await getMember(actor, actor.id).catch(handlePageError);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
          <Badge variant={member.status === "ACTIVE" ? "default" : "outline"}>
            {member.status === "ACTIVE" ? "Active" : "Suspended"}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Member #{member.memberProfile?.memberNumber ?? "—"} · Joined{" "}
          {(member.memberProfile?.joinDate ?? member.createdAt).toLocaleDateString()}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p>{member.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date of birth</p>
            <p>
              {member.memberProfile?.dateOfBirth
                ? member.memberProfile.dateOfBirth.toLocaleDateString()
                : "Not on file"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            To change your email or date of birth, contact an admin.
          </p>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          <SelfProfileForm
            action={updateOwnProfileAction}
            defaultValues={{
              fullName: member.fullName,
              phone: member.phone ?? undefined,
              address: member.memberProfile?.address ?? undefined,
              emergencyContactName: member.memberProfile?.emergencyContactName ?? undefined,
              emergencyContactPhone: member.memberProfile?.emergencyContactPhone ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
