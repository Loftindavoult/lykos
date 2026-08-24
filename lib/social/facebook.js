// Facebook Page posting via the Meta Graph API.
//
// Requires a Meta developer app (developers.facebook.com) with:
//   - App ID / App Secret in FACEBOOK_APP_ID / FACEBOOK_APP_SECRET
//   - Valid OAuth redirect URI: https://<domain>/api/auth/facebook/callback
//   - Permissions requested: pages_show_list, pages_read_engagement, pages_manage_posts
//     (the last two require App Review before they work for anyone other than
//     the app's own developers/testers)
//
// The OAuth flow authenticates a person, then we look up the Facebook Pages
// they manage and store that Page's own access token — posting happens as
// the Page, not the person, which is what pages_manage_posts is for.

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function getAuthUrl(state, redirectUri) {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || "",
    redirect_uri: redirectUri,
    state,
    scope: "pages_show_list,pages_read_engagement,pages_manage_posts",
    response_type: "code",
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForUserToken(code, redirectUri) {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || "",
    client_secret: process.env.FACEBOOK_APP_SECRET || "",
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Facebook token exchange failed.");
  return data; // { access_token, token_type, expires_in }
}

// Returns the first Page the authenticated person manages, with that Page's
// own long-lived access token — the token actually used for posting.
export async function getFirstManagedPage(userAccessToken) {
  const res = await fetch(`${GRAPH_BASE}/me/accounts?access_token=${encodeURIComponent(userAccessToken)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Could not list Facebook Pages.");
  const page = data.data?.[0];
  if (!page) throw new Error("This Facebook account doesn't manage any Pages to post from.");
  return { id: page.id, name: page.name, accessToken: page.access_token };
}

export async function publishPost(pageAccessToken, pageId, caption) {
  const res = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ message: caption, access_token: pageAccessToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Facebook post failed.");
  return data.id; // external post id
}
