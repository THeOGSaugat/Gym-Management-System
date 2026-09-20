import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

/**
 * Stable post-login landing spot. It has no UI of its own — it just
 * resolves the signed-in user's role and forwards to their actual
 * dashboard. This keeps role-routing logic in one place instead of
 * duplicating it in the login action and anywhere else that needs a
 * "take me home" link.
 */
export default async function DashboardRouterPage() {
  const user = await requireUser();

  switch (user.role) {
    case "ADMIN":
      redirect("/admin/dashboard");
    case "TRAINER":
      redirect("/trainer/dashboard");
    case "MEMBER":
      redirect("/member/dashboard");
  }
}
