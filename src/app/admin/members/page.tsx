import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMembers } from "@/server/services/member.service";
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
  title: "Members",
};

function isUserStatus(value: string | undefined): value is UserStatus {
  return value === "ACTIVE" || value === "SUSPENDED";
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const status = isUserStatus(params.status) ? params.status : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, totalPages } = await listMembers(actor, { search, status, page });

  // Preserves the other filters/search when switching page or status, and
  // resets to page 1 whenever the filter itself changes.
  function buildHref(overrides: { q?: string; status?: string; page?: number }) {
    const next = new URLSearchParams();
    const q = overrides.q ?? search ?? "";
    const s = overrides.status ?? status ?? "";
    const p = overrides.page ?? page;
    if (q) next.set("q", q);
    if (s) next.set("status", s);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/members?${qs}` : "/admin/members";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-muted-foreground">{total} member{total === 1 ? "" : "s"}</p>
        </div>
        <Button render={<Link href="/admin/members/new">Add member</Link>} />
      </div>

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <Input
            id="q"
            name="q"
            placeholder="Name or email"
            defaultValue={search ?? ""}
            className="w-64"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          {/* Plain native select, not the shadcn/base-ui Select: this form
              is a zero-JS GET request (works with JS disabled, no client
              component needed), and a native <select> submits its value
              with the form automatically. Styled to match the design
              system's input/select tokens. */}
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
          <Button variant="ghost" render={<Link href="/admin/members">Clear</Link>} />
        )}
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          {search || status ? "No members match your search." : "No members yet."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((member) => (
                <TableRow key={member.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="hover:underline"
                    >
                      {member.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === "ACTIVE" ? "default" : "outline"}>
                      {member.status === "ACTIVE" ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(member.memberProfile?.joinDate ?? member.createdAt).toLocaleDateString()}
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
            {/* A disabled <a> would still navigate on click (the `disabled`
                attribute does nothing on anchors), so at the boundary we
                render a real disabled <button> instead of a Link. */}
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
