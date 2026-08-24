import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { exchangeCodeForToken, getMemberId } from "@/lib/social/linkedin";

export async function GET(request) {
  const session = await requireStaff();

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("li_oauth_state")?.value;
  cookieStore.delete("li_oauth_state");

  if (!code || !state || state !== expectedState) {
    redirect("/crm/marketing?linkedin_error=" + encodeURIComponent("Login was cancelled or the request expired."));
  }

  try {
    const redirectUri = `${url.origin}/api/auth/linkedin/callback`;
    const { access_token, expires_in } = await exchangeCodeForToken(code, redirectUri);
    const memberId = await getMemberId(access_token);

    await db.socialAccount.upsert({
      where: { platform: "linkedin" },
      update: {
        externalAccountId: memberId,
        accessToken: access_token,
        expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
        connectedByStaffId: session.id,
      },
      create: {
        platform: "linkedin",
        externalAccountId: memberId,
        accessToken: access_token,
        expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
        connectedByStaffId: session.id,
      },
    });
  } catch (err) {
    redirect("/crm/marketing?linkedin_error=" + encodeURIComponent(err.message));
  }

  redirect("/crm/marketing?linkedin_connected=1");
}
