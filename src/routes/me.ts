import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireUser } from "../middleware/auth.js";

const router = Router();

function generateReferralCode(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}${rand}`;
}

router.get("/me", requireUser, async (req, res) => {
  const { sub, email, name } = (req as any).user as {
    sub: string;
    email: string;
    name?: string;
  };

  const user = await prisma.user.upsert({
    where: { providerSub: sub },
    create: {
      provider: "google",
      providerSub: sub,
      email,
      name,
      referralCode: generateReferralCode(),
    },
    update: { email, name },
  });


  res.json(user);
});

export default router;
