import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
      <p className="text-muted-foreground">
        Trainer management, plans, payments, attendance and analytics will
        appear here in later phases.
      </p>
      <div>
        <Button render={<Link href="/admin/members">Manage members</Link>} />
      </div>
    </div>
  );
}
