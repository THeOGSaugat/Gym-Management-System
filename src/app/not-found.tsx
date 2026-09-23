import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { StatusScreen } from "@/components/ui/status-screen";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <StatusScreen
          icon={FileQuestion}
          eyebrow="404 · Not found"
          title="Page not found"
          description="This page doesn't exist, or the record it pointed at has been removed."
          actions={
            <Button
              className="w-full sm:w-auto"
              nativeButton={false}
              render={<Link href="/dashboard">Back to my dashboard</Link>}
            />
          }
        />
      </main>
    </div>
  );
}
