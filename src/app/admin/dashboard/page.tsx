import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
      <p className="text-muted-foreground">Analytics will appear here in a later phase.</p>
      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/admin/members">Manage members</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/trainers">Manage trainers</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/plans">Membership plans</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/payments">Payments</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/attendance">Attendance</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/exercises">Exercise library</Link>} />
      </div>
    </div>
  );
}
