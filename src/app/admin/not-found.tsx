import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/ui/status-screen";

/**
 * Rendered inside the admin app shell when a page calls `notFound()` — e.g.
 * a record id that doesn't exist — so the navigation stays available.
 */
export default function AdminNotFound() {
  return (
    <StatusScreen
      icon={FileQuestion}
      eyebrow="404 · Not found"
      title="We couldn't find that"
      description="The record you were looking for doesn't exist, or it may have been removed."
      actions={
        <Button
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link href="/admin/dashboard">Back to dashboard</Link>}
        />
      }
    />
  );
}
