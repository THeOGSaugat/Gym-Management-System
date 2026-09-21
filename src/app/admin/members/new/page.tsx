import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberForm } from "@/components/members/member-form";
import { createMemberAction } from "../actions";

export const metadata: Metadata = {
  title: "Add member",
};

export default async function NewMemberPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add member</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Member details</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberForm mode="create" action={createMemberAction} />
        </CardContent>
      </Card>
    </div>
  );
}
