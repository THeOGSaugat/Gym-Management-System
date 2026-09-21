import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MemberDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Member dashboard</h1>
      <p className="text-muted-foreground">
        Your workout plan and progress will appear here in later phases.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/member/profile">View my profile</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/member/membership">My membership</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/member/payments">My payments</Link>} />
      </div>
    </div>
  );
}
