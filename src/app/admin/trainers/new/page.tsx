import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainerForm } from "@/components/trainers/trainer-form";
import { createTrainerAction } from "../actions";

export const metadata: Metadata = {
  title: "Add trainer",
};

export default async function NewTrainerPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add trainer</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Trainer details</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainerForm mode="create" action={createTrainerAction} />
        </CardContent>
      </Card>
    </div>
  );
}
