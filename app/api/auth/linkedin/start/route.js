import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { getAuthUrl } from "@/lib/social/linkedin";

export async function GET(request) {
  await requireStaff();

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("li_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const redirectUri = `${new URL(request.url).origin}/api/auth/linkedin/callback`;
  redirect(getAuthUrl(state, redirectUri));
}
