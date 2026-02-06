import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { exchangeCodeForProfile, getGoogleAuthUrl } from "../auth/google.js";

const router = Router();

function genReferralCode(len = 10) {
  return crypto.randomBytes(Math.ceil(len)).toString("base64url").slice(0, len);
}

router.get("/auth/google/start", (req, res) => {
  const state = crypto.randomUUID();

  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 10 * 60 * 1000
  });

  const url = getGoogleAuthUrl(state);
  return res.redirect(url);
});

router.get("/auth/google/callback", async (req, res) => {
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    const cookieState = String((req as any).cookies?.oauth_state || "");

    if (!code) return res.status(400).send("Missing code");
    if (!state) return res.status(400).send("Missing state");
    if (!cookieState || cookieState !== state) return res.status(400).send("Invalid state");

    const profile = await exchangeCodeForProfile(code);

    const user = await prisma.user.upsert({
      where: { providerSub: profile.sub },
      update: {
        email: profile.email,
        name: profile.name ?? null,
        pictureUrl: profile.pictureUrl ?? null,
        provider: "google"
      },
      create: {
        provider: "google",
        providerSub: profile.sub,
        email: profile.email,
        name: profile.name ?? null,
        pictureUrl: profile.pictureUrl ?? null,
        referralCode: genReferralCode(10),
        referredByUserId: null
      }
    });

  const secret: jwt.Secret = process.env.JWT_SECRET ?? "dev-secret-local";
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  const token = jwt.sign({ uid: user.id }, secret, { expiresIn: expiresIn as any });

    res.clearCookie("oauth_state");

    const frontend = process.env.FRONTEND_BASE_URL;
    if (!frontend) return res.json({ ok: true, token, user });

    return res.redirect(`${frontend}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return res.status(500).send("OAuth callback failed");
  }
});

export default router;
