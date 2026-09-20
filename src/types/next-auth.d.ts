import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

/**
 * Auth.js's default session/user/JWT types don't know about our `role`
 * field. This augments them so `session.user.role` and `token.role` are
 * typed everywhere instead of `any`.
 */
declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
