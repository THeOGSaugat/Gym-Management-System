import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MemberForm } from "@/components/members/member-form";
import { createMemberAction } from "../actions";

export const metadata: Metadata = {
  title: "Add member",
};

export default async function NewMemberPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref="/admin/members"
        backLabel="Members"
        title="Add member"
        description="Creates the account and their member profile. You can assign a membership and a trainer once they exist."
      />
      <Card className="max-w-2xl">
        <CardContent>
          <MemberForm mode="create" action={createMemberAction} />
        </CardContent>
      </Card>
    </div>
  );
}
