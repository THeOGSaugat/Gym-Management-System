"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth/auth";
import { loginSchema } from "@/lib/validations/auth";

export type LoginState = { error: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // Deliberately generic: covers "no such account", "wrong password",
      // and "rate limited" alike. Rate limiting itself is enforced in
      // authorize() (src/lib/auth/auth.ts), which is the real chokepoint —
      // Auth.js's callback route is reachable directly, bypassing this
      // server action entirely.
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  redirect("/dashboard");
}
