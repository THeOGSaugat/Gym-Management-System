import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getTrainer } from "@/server/services/trainer.service";
import { listAssignedMembers } from "@/server/services/assignment.service";
import { handlePageError } from "@/lib/service-error";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard } from "@/components/ui/list-card";
import { DetailGrid, DetailItem, Section } from "@/components/ui/section";
import { SectionTabs } from "@/components/ui/section-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrainerForm } from "@/components/trainers/trainer-form";
import { updateTrainerAction, setTrainerStatusAction } from "../actions";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Trainer",
};

type Tab = "overview" | "settings";

export default async function TrainerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;
  const query = await searchParams;
  const tab: Tab = query.section === "settings" ? "settings" : "overview";

  const trainer = await getTrainer(actor, id).catch(handlePageError);
  const assignedMembers = await listAssignedMembers(actor, trainer.id);

  const boundUpdateAction = updateTrainerAction.bind(null, trainer.id);
  const nextStatus = trainer.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  const toggleStatusAction = setTrainerStatusAction.bind(null, trainer.id, nextStatus);
  const base = `/admin/trainers/${trainer.id}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref="/admin/trainers"
        backLabel="Trainers"
        title={trainer.fullName}
        badge={<StatusBadge kind="account" status={trainer.status} />}
        description={
          trainer.trainerProfile?.specialization ?? "No specialization on file"
        }
      />

      <SectionTabs
        items={[
          { label: "Overview", href: base, active: tab === "overview" },
          { label: "Settings", href: `${base}?section=settings`, active: tab === "settings" },
        ]}
      />

      {tab === "overview" ? (
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <DetailGrid>
                <DetailItem label="Email">
                  <a href={`mailto:${trainer.email}`} className="hover:underline">
                    {trainer.email}
                  </a>
                </DetailItem>
                <DetailItem label="Phone">
                  {trainer.phone ? (
                    <a href={`tel:${trainer.phone}`} className="hover:underline">
                      {trainer.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not on file</span>
                  )}
                </DetailItem>
                <DetailItem label="Experience">
                  {trainer.trainerProfile?.experienceYears != null ? (
                    `${trainer.trainerProfile.experienceYears} year${trainer.trainerProfile.experienceYears === 1 ? "" : "s"}`
                  ) : (
                    <span className="text-muted-foreground">Not on file</span>
                  )}
                </DetailItem>
                <DetailItem label="Assigned members">
                  {assignedMembers.length}
                </DetailItem>
              </DetailGrid>

              {trainer.trainerProfile?.bio ? (
                <p className="mt-5 border-t border-border pt-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {trainer.trainerProfile.bio}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Section
            title="Assigned members"
            description={`${assignedMembers.length} member${assignedMembers.length === 1 ? "" : "s"} currently assigned`}
          >
            {assignedMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members assigned"
                description="Assign members to this trainer from a member's Training tab."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {assignedMembers.map((assignment) => (
                  <li key={assignment.id}>
                    <ListCard
                      href={`/admin/members/${assignment.memberId}`}
                      avatarName={assignment.member.fullName}
                      title={assignment.member.fullName}
                      meta={`Assigned since ${assignment.startDate.toLocaleDateString(undefined, zoned())}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Section title="Trainer details">
            <Card>
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
          </Section>

          <Section title="Danger zone">
            <Card className="border-destructive-border">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {trainer.status === "ACTIVE" ? "Deactivate trainer" : "Reactivate trainer"}
                  </p>
                  <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {trainer.status === "ACTIVE"
                      ? "Prevents this trainer from signing in and ends their current assignments."
                      : "Restores access. Previous assignments stay ended — reassign members as needed."}
                  </p>
                </div>

                {trainer.status === "ACTIVE" ? (
                  <ConfirmAction
                    action={toggleStatusAction}
                    title={`Deactivate ${trainer.fullName}?`}
                    description="This ends their active assignments and prevents them from accessing the trainer portal."
                    consequences={[
                      assignedMembers.length > 0
                        ? `${assignedMembers.length} member${assignedMembers.length === 1 ? "" : "s"} will immediately show as having no trainer.`
                        : "They currently have no assigned members.",
                      "Workout plans they created are kept, but they can no longer edit them.",
                    ]}
                    reversibility="Reactivating restores their login, but does not restore the assignments — you'd reassign each member."
                    confirmLabel="Deactivate trainer"
                    triggerLabel="Deactivate"
                    triggerClassName="w-full sm:w-auto"
                  />
                ) : (
                  <ConfirmAction
                    action={toggleStatusAction}
                    tone="default"
                    title={`Reactivate ${trainer.fullName}?`}
                    description="They'll be able to sign in to the trainer portal again."
                    consequences={[
                      "Previously ended assignments are not restored — assign members again as needed.",
                    ]}
                    reversibility="Reversible — you can deactivate again later."
                    confirmLabel="Reactivate trainer"
                    triggerLabel="Reactivate"
                    triggerVariant="outline"
                    triggerClassName="w-full sm:w-auto"
                  />
                )}
              </CardContent>
            </Card>
          </Section>
        </div>
      )}
    </div>
  );
}
