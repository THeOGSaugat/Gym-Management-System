import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listTrainers } from "@/server/services/trainer.service";
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
import type { UserStatus } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Trainers",
};

function isUserStatus(value: string | undefined): value is UserStatus {
  return value === "ACTIVE" || value === "SUSPENDED";
}

export default async function TrainersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const status = isUserStatus(params.status) ? params.status : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, totalPages } = await listTrainers(actor, { search, status, page });

  function buildHref(overrides: { page?: number }) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (status) next.set("status", status);
    const p = overrides.page ?? page;
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/trainers?${qs}` : "/admin/trainers";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trainers</h1>
          <p className="text-muted-foreground">{total} trainer{total === 1 ? "" : "s"}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/trainers/new">Add trainer</Link>} />
      </div>

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <Input id="q" name="q" placeholder="Name or email" defaultValue={search ?? ""} className="w-64" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
        {(search || status) && (
          <Button variant="ghost" nativeButton={false} render={<Link href="/admin/trainers">Clear</Link>} />
        )}
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          {search || status ? "No trainers match your search." : "No trainers yet."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((trainer) => (
                <TableRow key={trainer.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/trainers/${trainer.id}`} className="hover:underline">
                      {trainer.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{trainer.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {trainer.trainerProfile?.specialization ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={trainer.status === "ACTIVE" ? "default" : "outline"}>
                      {trainer.status === "ACTIVE" ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={buildHref({ page: page - 1 })}>Previous</Link>}
              />
            )}
            {page >= totalPages ? (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={buildHref({ page: page + 1 })}>Next</Link>}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
