"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword, createSession, destroySession } from "@/lib/auth";

export async function login(prevState, formData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await db.staffUser.findUnique({ where: { email } });
  if (!user) {
    return { error: "That email and password don't match." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "That email and password don't match." };
  }

  await createSession({ id: user.id, email: user.email, name: user.name });
  redirect("/crm");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
