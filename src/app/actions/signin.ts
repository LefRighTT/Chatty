"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type AuthActionState = { error?: string } | undefined;

export async function handleCredentialsSignIn(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/rooms",
    });
  } catch (error) {
    // NextAuth throws a redirect internally on success - let that propagate.
    // Only genuine auth failures should be turned into a friendly message.
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}