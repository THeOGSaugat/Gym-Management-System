import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MemberDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Member dashboard</h1>
      <p className="text-muted-foreground">
        Your membership status, workout plan, progress and payment history
        will appear here in later phases.
      </p>
      <div>
        <Button nativeButton={false} render={<Link href="/member/profile">View my profile</Link>} />
      </div>
    </div>
  );
}
