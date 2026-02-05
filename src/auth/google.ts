type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  pictureUrl?: string;
};

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function getGoogleAuthUrl(state: string) {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const redirectUri = requireEnv("GOOGLE_REDIRECT_URI");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "consent");

  return url.toString();
}

export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = requireEnv("GOOGLE_REDIRECT_URI");

  // 1) code -> tokens
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson: any = await tokenResp.json();
  if (!tokenResp.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(tokenJson)}`);
  }

  const accessToken = tokenJson.access_token as string;
  if (!accessToken) throw new Error("No access_token returned by Google");

  // 2) tokens -> profile (userinfo)
  const userResp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const userJson: any = await userResp.json();
  if (!userResp.ok) {
    throw new Error(`Userinfo failed: ${JSON.stringify(userJson)}`);
  }

  return {
    sub: String(userJson.sub),
    email: String(userJson.email),
    name: String(userJson.name || userJson.email),
    pictureUrl: userJson.picture ? String(userJson.picture) : undefined,
  };
}
