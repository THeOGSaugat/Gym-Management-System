import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getMember } from "@/server/services/member.service";
import { handlePageError } from "@/lib/service-error";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailGrid, DetailItem } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { SelfProfileForm } from "@/components/members/self-profile-form";
import { updateOwnProfileAction } from "./actions";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function MemberProfilePage() {
  const actor = await requireRole("MEMBER");

  // getMember enforces "self only" (canViewMember), so passing actor.id
  // here isn't a bypassable shortcut — even if this page were ever changed
  // to accept a param, the service would still refuse.
  const member = await getMember(actor, actor.id).catch(handlePageError);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profile"
        badge={<StatusBadge kind="account" status={member.status} />}
        description={
          <>
            Member #{member.memberProfile?.memberNumber ?? "—"} · Joined{" "}
            {(member.memberProfile?.joinDate ?? member.createdAt).toLocaleDateString(
              undefined,
              zoned(),
            )}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DetailGrid>
            <DetailItem label="Email">{member.email}</DetailItem>
            <DetailItem label="Date of birth">
              {member.memberProfile?.dateOfBirth
                ? member.memberProfile.dateOfBirth.toLocaleDateString(undefined, zoned())
                : "Not on file"}
            </DetailItem>
          </DetailGrid>
          <p className="text-xs text-muted-foreground">
            To change your email or date of birth, contact an admin.
          </p>
        </CardContent>
      </Card>

      <Card>
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
