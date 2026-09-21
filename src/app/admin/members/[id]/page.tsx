import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getMember } from "@/server/services/member.service";
import { listMembershipsForMember } from "@/server/services/membership.service";
import { listPaymentsForMember } from "@/server/services/payment.service";
import { handlePageError } from "@/lib/service-error";
import { toDateInputValue } from "@/lib/date";
import { formatMinorUnits } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberForm } from "@/components/members/member-form";
import { updateMemberAction, setMemberStatusAction } from "../actions";

export const metadata: Metadata = {
  title: "Member details",
};

const MEMBERSHIP_STATUS_VARIANT = {
  ACTIVE: "default",
  PENDING: "secondary",
  EXPIRED: "outline",
  CANCELLED: "outline",
} as const;

const PAYMENT_STATUS_VARIANT = {
  SUCCEEDED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  REFUNDED: "outline",
} as const;

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;

  const member = await getMember(actor, id).catch(handlePageError);
  const [memberships, payments] = await Promise.all([
    listMembershipsForMember(actor, member.id),
    listPaymentsForMember(actor, member.id),
  ]);

  const boundUpdateAction = updateMemberAction.bind(null, member.id);
  const nextStatus = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  const toggleStatusAction = setMemberStatusAction.bind(null, member.id, nextStatus);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{member.fullName}</h1>
            <Badge variant={member.status === "ACTIVE" ? "default" : "outline"}>
              {member.status === "ACTIVE" ? "Active" : "Suspended"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Member #{member.memberProfile?.memberNumber ?? "—"} · Joined{" "}
            {(member.memberProfile?.joinDate ?? member.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Member details</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberForm
            mode="edit"
            action={boundUpdateAction}
            defaultValues={{
              fullName: member.fullName,
              email: member.email,
              phone: member.phone ?? undefined,
              dateOfBirth: toDateInputValue(member.memberProfile?.dateOfBirth),
              address: member.memberProfile?.address ?? undefined,
              emergencyContactName: member.memberProfile?.emergencyContactName ?? undefined,
              emergencyContactPhone: member.memberProfile?.emergencyContactPhone ?? undefined,
            }}
          />
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Memberships</CardTitle>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/admin/members/${member.id}/memberships/new`}>Assign membership</Link>}
          />
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No memberships yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Link
                        href={`/admin/members/${member.id}/memberships/${m.id}`}
                        className="font-medium hover:underline"
                      >
                        {m.planNameSnapshot}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatMinorUnits(m.priceMinorSnapshot, m.currencySnapshot)}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.startDate.toLocaleDateString()} – {m.endDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={MEMBERSHIP_STATUS_VARIANT[m.status]}>{m.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payments</CardTitle>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href={`/admin/members/${member.id}/payments/new`}>Record payment</Link>}
          />
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link href={`/admin/payments/${payment.id}`} className="hover:underline">
                        {payment.paidAt.toLocaleDateString()}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatMinorUnits(payment.amountMinor, payment.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.method === "BANK_TRANSFER"
                        ? "Bank transfer"
                        : payment.method === "CASH"
                          ? "Cash"
                          : "Other"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={PAYMENT_STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {member.status === "ACTIVE"
                ? "Deactivating prevents this member from logging in. Their data is kept."
                : "Reactivating allows this member to log in again."}
            </p>
            <form action={toggleStatusAction}>
              <Button type="submit" variant={member.status === "ACTIVE" ? "destructive" : "outline"}>
                {member.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
