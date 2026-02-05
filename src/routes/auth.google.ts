import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { exchangeCodeForProfile, getGoogleAuthUrl } from "../auth/google";

const router = Router();

function genReferralCode(len = 10) {
  return crypto
    .randomBytes(Math.ceil(len))
    .toString("base64url")
    .slice(0, len);
}

router.get("/auth/google/start", (req, res) => {
  const state = crypto.randomUUID();

  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // prod: true (https)
    maxAge: 10 * 60 * 1000, // 10 min
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

    const profile = await exchangeCodeForProfile(code); // { sub, email, name, pictureUrl? }

    const user = await prisma.user.upsert({
      where: { providerSub: profile.sub },
      update: {
        email: profile.email,
        name: profile.name,
        pictureUrl: profile.pictureUrl ?? null,
        provider: "google",
      },
      create: {
        provider: "google",
        providerSub: profile.sub,
        email: profile.email,
        name: profile.name,
        pictureUrl: profile.pictureUrl ?? null,
        referralCode: genReferralCode(10),
        referredByUserId: null,
      },
    });


    const secret = process.env.JWT_SECRET || "dev-secret-local";
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    const token = jwt.sign({ uid: user.id }, secret, { expiresIn });

    // Limpieza del state cookie
    res.clearCookie("oauth_state");

    const frontend = process.env.FRONTEND_BASE_URL;

    // Si no hay frontend, devolvemos JSON (útil para backend-only y pruebas)
    if (!frontend) {
      return res.json({ ok: true, token, user });
    }

    // Si hay frontend, redirigimos
    return res.redirect(`${frontend}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return res.status(500).send("OAuth callback failed");
  }
});

export default router;
