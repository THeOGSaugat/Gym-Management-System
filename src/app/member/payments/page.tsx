import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listPaymentsForMember } from "@/server/services/payment.service";
import { formatMinorUnits } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  title: "My payments",
};

const STATUS_VARIANT = {
  SUCCEEDED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  REFUNDED: "outline",
} as const;

export default async function MyPaymentsPage() {
  const actor = await requireRole("MEMBER");

  // listPaymentsForMember enforces "self only" — a member can never load
  // another member's history through this page, even if the function
  // signature is later reused elsewhere.
  const payments = await listPaymentsForMember(actor, actor.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">My payments</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments on record.</p>
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
                    <TableCell>{payment.paidAt.toLocaleDateString()}</TableCell>
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
                      <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
