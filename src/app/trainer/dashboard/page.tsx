import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TrainerDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Trainer dashboard</h1>
      <p className="text-muted-foreground">
        Build workout plans for your assigned members and add new
        exercises to the shared library.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/trainer/members">My members</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/trainer/exercises/new">Add exercise</Link>} />
      </div>
    </div>
  );
}
