import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./config";
import { clientKeyFromRequest, verifyCredentials } from "./credentials";

/**
 * Full Auth.js instance. Node-only — imports Prisma and bcrypt (via
 * credentials.ts), so this must never be imported from `proxy.ts`. Route
 * handlers, server components, and server actions import from here.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Validation, rate limiting and the password check all live in
      // verifyCredentials() — see credentials.ts.
      authorize: (rawCredentials, request) =>
        verifyCredentials(rawCredentials, clientKeyFromRequest(request)),
    }),
  ],
});
