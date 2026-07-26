"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

export type AuthActionState = { error?: string } | undefined;

export async function handleSignUp(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error: "An account with this email already exists. Try signing in instead.",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  // Auto sign-in right after account creation for a smooth flow -
  // no separate manual login step required.
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/rooms",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Account created, but automatic sign-in failed. Please sign in manually.",
      };
    }
    throw error;
  }
}