import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { exchangeCodeForUserToken, getFirstManagedPage } from "@/lib/social/facebook";

export async function GET(request) {
  const session = await requireStaff();

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("fb_oauth_state")?.value;
  cookieStore.delete("fb_oauth_state");

  if (!code || !state || state !== expectedState) {
    redirect("/crm/marketing?facebook_error=" + encodeURIComponent("Login was cancelled or the request expired."));
  }

  try {
    const redirectUri = `${url.origin}/api/auth/facebook/callback`;
    const { access_token } = await exchangeCodeForUserToken(code, redirectUri);
    const page = await getFirstManagedPage(access_token);

    await db.socialAccount.upsert({
      where: { platform: "facebook" },
      update: {
        externalAccountId: page.id,
        accessToken: page.accessToken,
        connectedByStaffId: session.id,
      },
      create: {
        platform: "facebook",
        externalAccountId: page.id,
        accessToken: page.accessToken,
        connectedByStaffId: session.id,
      },
    });
  } catch (err) {
    redirect("/crm/marketing?facebook_error=" + encodeURIComponent(err.message));
  }

  redirect("/crm/marketing?facebook_connected=1");
}
