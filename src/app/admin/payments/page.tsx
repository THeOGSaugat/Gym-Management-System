import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listPayments } from "@/server/services/payment.service";
import { formatMinorUnits } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentMethodValues, paymentStatusValues } from "@/lib/validations/payment";
import type { PaymentMethod, PaymentStatus } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Payments",
};

function isPaymentMethod(value: string | undefined): value is PaymentMethod {
  return !!value && (paymentMethodValues as readonly string[]).includes(value);
}

function isPaymentStatus(value: string | undefined): value is PaymentStatus {
  return !!value && (paymentStatusValues as readonly string[]).includes(value);
}

const STATUS_VARIANT = {
  SUCCEEDED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  REFUNDED: "outline",
} as const;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; method?: string; status?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const method = isPaymentMethod(params.method) ? params.method : undefined;
  const status = isPaymentStatus(params.status) ? params.status : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, totalPages } = await listPayments(actor, {
    search,
    method,
    status,
    page,
  });

  function buildHref(overrides: { page?: number }) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (method) next.set("method", method);
    if (status) next.set("status", status);
    const p = overrides.page ?? page;
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/payments?${qs}` : "/admin/payments";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">{total} payment{total === 1 ? "" : "s"}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <Input id="q" name="q" placeholder="Member name or email" defaultValue={search ?? ""} className="w-64" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="method" className="text-sm font-medium">
            Method
          </label>
          <select
            id="method"
            name="method"
            defaultValue={method ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">All</option>
            {paymentMethodValues.map((m) => (
              <option key={m} value={m}>
                {m === "BANK_TRANSFER" ? "Bank transfer" : m === "CASH" ? "Cash" : "Other"}
              </option>
            ))}
          </select>
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
            {paymentStatusValues.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
        {(search || method || status) && (
          <Button variant="ghost" nativeButton={false} render={<Link href="/admin/payments">Clear</Link>} />
        )}
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          {search || method || status ? "No payments match your search." : "No payments recorded yet."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link href={`/admin/payments/${payment.id}`} className="hover:underline">
                      {payment.paidAt.toLocaleDateString()}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/members/${payment.memberId}`} className="hover:underline">
                      {payment.member.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatMinorUnits(payment.amountMinor, payment.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.method === "BANK_TRANSFER" ? "Bank transfer" : payment.method === "CASH" ? "Cash" : "Other"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
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
