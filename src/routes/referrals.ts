import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireUser } from "../middleware/auth.js";

const router = Router();

function generateReferralCode(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}${rand}`;
}

async function getOrCreateAuthedUser(req: any) {
  const u = req.user as { id?: string; sub: string; email: string; name?: string };

  if (u?.id) {
    const user = await prisma.user.findUnique({ where: { id: u.id } });
    if (!user) throw new Error("user_not_found");
    return user;
  }

  const sub = u?.sub || "";
  const email = u?.email || "";
  const safeName = u?.name ?? null;

  if (!sub || !email) throw new Error("unauthorized");

  return prisma.user.upsert({
    where: { providerSub: sub },
    create: {
      provider: "google",
      providerSub: sub,
      email,
      name: safeName,
      referralCode: generateReferralCode(),
      referredByUserId: null
    },
    update: { email, name: safeName }
  });
}

async function handleClaim(req: any, res: any) {
  const me = await getOrCreateAuthedUser(req);

  const code = String(req.body?.code || "").trim();
  if (!code) return res.status(400).json({ error: "code_required" });

  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!referrer) return res.status(404).json({ error: "code_not_found" });

  if (referrer.id === me.id) return res.status(400).json({ error: "cannot_self_refer" });
  if (me.referredByUserId) return res.status(400).json({ error: "already_referred" });

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: { referredByUserId: referrer.id }
  });

  await prisma.referralAudit.create({
    data: {
      userId: updated.id,
      referredByUserId: referrer.id,
      codeUsed: code
    }
  });

  return res.json({
    ok: true,
    referredByUserId: referrer.id,
    codeUsed: code
  });
}

// ✅ TASKS alias: GET /api/referrals  -> listar mis referidos
router.get("/", requireUser, async (req, res) => {
  try {
    const me = await getOrCreateAuthedUser(req as any);

    const referrals = await prisma.user.findMany({
      where: { referredByUserId: me.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    return res.json({ count: referrals.length, referrals });
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
});

// ✅ existente
router.get("/my-code", requireUser, async (req, res) => {
  try {
    const user = await getOrCreateAuthedUser(req as any);
    return res.json({ referralCode: user.referralCode });
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
});

// ✅ existente
router.get("/summary", requireUser, async (req, res) => {
  try {
    const user = await getOrCreateAuthedUser(req as any);

    const referralsCount = await prisma.user.count({
      where: { referredByUserId: user.id }
    });

    return res.json({
      userId: user.id,
      referralCode: user.referralCode,
      referralsCount
    });
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
});

// ✅ existente
router.post("/claim", requireUser, async (req, res) => {
  try {
    return await handleClaim(req as any, res);
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
});

// ✅ TASKS alias: POST /api/referrals/apply -> mismo que claim
router.post("/apply", requireUser, async (req, res) => {
  try {
    return await handleClaim(req as any, res);
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
});

export default router;
