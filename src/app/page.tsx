import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-24 sm:px-6">
        <div className="flex max-w-xl flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Run your gym from one place
          </h1>
          <p className="text-balance text-muted-foreground">
            Members, trainers, memberships, payments and attendance — all in a
            single system. This project is under active development.
          </p>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/login">Log in</Link>}
          />
        </div>
      </main>
    </div>
  );
}
