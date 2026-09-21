import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TrainerDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Trainer dashboard</h1>
      <p className="text-muted-foreground">
        Workout plans and progress tracking will appear here in later phases.
      </p>
      <div>
        <Button nativeButton={false} render={<Link href="/trainer/members">My members</Link>} />
      </div>
    </div>
  );
}
