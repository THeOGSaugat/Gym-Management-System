import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm } from "@/components/plans/plan-form";
import { createPlanAction } from "../actions";

export const metadata: Metadata = {
  title: "New plan",
};

export default async function NewPlanPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">New plan</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Plan details</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm mode="create" action={createPlanAction} />
        </CardContent>
      </Card>
    </div>
  );
}
