// LinkedIn posting via the UGC Posts API, authenticated as the connected
// member (posts appear as that person, not a Company Page).
//
// Requires a LinkedIn developer app (linkedin.com/developers) with:
//   - Client ID / Client Secret in LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
//   - Valid OAuth redirect URI: https://<domain>/api/auth/linkedin/callback
//   - "Sign In with LinkedIn using OpenID Connect" product added (for identity)
//   - "Share on LinkedIn" product added (for w_member_social, the posting scope)
//     — both require the app to be approved for those products before this works.

const AUTH_BASE = "https://www.linkedin.com/oauth/v2";
const API_BASE = "https://api.linkedin.com/v2";

export function getAuthUrl(state, redirectUri) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID || "",
    redirect_uri: redirectUri,
    state,
    scope: "openid profile w_member_social",
  });
  return `${AUTH_BASE}/authorization?${params.toString()}`;
}

export async function exchangeCodeForToken(code, redirectUri) {
  const res = await fetch(`${AUTH_BASE}/accessToken`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID || "",
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "LinkedIn token exchange failed.");
  return data; // { access_token, expires_in }
}

export async function getMemberId(accessToken) {
  const res = await fetch(`${API_BASE.replace("/v2", "")}/v2/userinfo`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Could not read LinkedIn member profile.");
  return data.sub; // member id used to build the author URN
}

export async function publishPost(accessToken, memberId, caption) {
  const res = await fetch(`${API_BASE}/ugcPosts`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "x-restli-protocol-version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${memberId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "LinkedIn post failed.");
  }
  return res.headers.get("x-restli-id") || null; // external post id
}
