import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listExercises } from "@/server/services/exercise.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exercise library</h1>
          <p className="text-muted-foreground">
            {exercises.length} exercise{exercises.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/exercises/new">Add exercise</Link>} />
      </div>

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <Input id="q" name="q" placeholder="Exercise name" defaultValue={search ?? ""} className="w-64" />
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
        {search && <Button variant="ghost" nativeButton={false} render={<Link href="/admin/exercises">Clear</Link>} />}
      </form>

      {exercises.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          {search ? "No exercises match your search." : "No exercises yet."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Muscle group</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercises.map((exercise) => (
                <TableRow key={exercise.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/exercises/${exercise.id}`} className="hover:underline">
                      {exercise.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {exercise.muscleGroup ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={exercise.isActive ? "default" : "outline"}>
                      {exercise.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
