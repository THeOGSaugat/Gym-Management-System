import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell, Plus, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listExercises } from "@/server/services/exercise.service";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/components/ui/list-card";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = {
  title: "Exercise library",
};

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;
  const search = params.q?.trim() || undefined;

  const exercises = await listExercises(actor, { search, includeInactive: true });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exercise library"
        description={`${exercises.length} exercise${exercises.length === 1 ? "" : "s"} shared across every workout plan`}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/exercises/new">
                <Plus aria-hidden="true" />
                Add exercise
              </Link>
            }
          />
        }
      />

      <form method="GET" className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-xs">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <Input id="q" name="q" placeholder="Exercise name" defaultValue={search ?? ""} />
        </div>
        <Button type="submit" variant="outline">
          <Search aria-hidden="true" />
          Search
        </Button>
        {search ? (
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/admin/exercises">Clear</Link>}
          />
        ) : null}
      </form>

      {exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={search ? "No exercises match your search" : "The library is empty"}
          description={
            search
              ? "Try a different name, or add this exercise to the library."
              : "Add exercises so trainers can build workout days from them."
          }
          action={
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/exercises/new">Add exercise</Link>}
            />
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <ListCard
                href={`/admin/exercises/${exercise.id}`}
                icon={Dumbbell}
                title={exercise.name}
                subtitle={exercise.muscleGroup ?? undefined}
                trailing={
                  <StatusBadge
                    kind="exercise"
                    status={exercise.isActive ? "ACTIVE" : "INACTIVE"}
                    size="sm"
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
