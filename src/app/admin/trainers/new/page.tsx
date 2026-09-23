import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TrainerForm } from "@/components/trainers/trainer-form";
import { createTrainerAction } from "../actions";

export const metadata: Metadata = {
  title: "Add trainer",
};

export default async function NewTrainerPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref="/admin/trainers"
        backLabel="Trainers"
        title="Add trainer"
        description="Creates the trainer's account and profile. Members can be assigned to them straight away."
      />
      <Card className="max-w-2xl">
        <CardContent>
          <TrainerForm mode="create" action={createTrainerAction} />
        </CardContent>
      </Card>
    </div>
  );
}
