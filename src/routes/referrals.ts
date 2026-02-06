import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireUser } from "../middleware/auth.js";

const router = Router();

const ClaimSchema = z.object({
  code: z.string().trim().min(1).max(64),
});

function generateReferralCode(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}${rand}`;
}

async function getOrCreateAuthedUser(req: any) {
  const u = req.user as { id?: string; sub?: string; email?: string; name?: string };

  if (u?.id) {
    const user = await prisma.user.findUnique({ where: { id: u.id } });
    if (!user) throw new Error("user_not_found");
    return user;
  }

  const sub = u?.sub ?? "";
  const email = u?.email ?? "";
  const name = u?.name ?? null;

  if (!sub || !email) throw new Error("unauthorized");

  return prisma.user.upsert({
    where: { providerSub: sub },
    create: {
      provider: "google",
      providerSub: sub,
      email,
      name,
      referralCode: generateReferralCode(),
      referredByUserId: null,
      pictureUrl: null,
    },
    update: {
      email,
      name,
    },
  });
}

// GET /api/referrals -> listar mis referidos
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
        createdAt: true,
      },
    });

    return res.json({ count: referrals.length, referrals });
  } catch (err) {
    const msg = String((err as any)?.message || err);
    if (msg.includes("unauthorized")) return res.status(401).json({ error: "unauthorized" });
    return res.status(500).json({ error: "server_error" });
  }
});

// GET /api/referrals/my-code
router.get("/my-code", requireUser, async (req, res) => {
  try {
    const user = await getOrCreateAuthedUser(req as any);
    return res.json({ referralCode: user.referralCode });
  } catch (err) {
    const msg = String((err as any)?.message || err);
    if (msg.includes("unauthorized")) return res.status(401).json({ error: "unauthorized" });
    return res.status(500).json({ error: "server_error" });
  }
});

// GET /api/referrals/summary
router.get("/summary", requireUser, async (req, res) => {
  try {
    const user = await getOrCreateAuthedUser(req as any);

    const referralsCount = await prisma.user.count({
      where: { referredByUserId: user.id },
    });

    return res.json({
      userId: user.id,
      referralCode: user.referralCode,
      referralsCount,
    });
  } catch (err) {
    const msg = String((err as any)?.message || err);
    if (msg.includes("unauthorized")) return res.status(401).json({ error: "unauthorized" });
    return res.status(500).json({ error: "server_error" });
  }
});

async function handleClaim(req: any, res: any) {
  try {
    const me = await getOrCreateAuthedUser(req);

    const parsed = ClaimSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
    const code = parsed.data.code;

    const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!referrer) return res.status(404).json({ error: "code_not_found" });

    if (referrer.id === me.id) return res.status(400).json({ error: "cannot_self_refer" });
    if (me.referredByUserId) return res.status(400).json({ error: "already_referred" });

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: { referredByUserId: referrer.id },
    });

    await prisma.referralAudit.create({
      data: {
        userId: updated.id,
        referredByUserId: referrer.id,
        codeUsed: code,
      },
    });

    return res.json({
      ok: true,
      referredByUserId: referrer.id,
      codeUsed: code,
    });
  } catch (err) {
    const msg = String((err as any)?.message || err);
    if (msg.includes("unauthorized")) return res.status(401).json({ error: "unauthorized" });
    return res.status(500).json({ error: "server_error" });
  }
}

// POST /api/referrals/claim { code }
router.post("/claim", requireUser, handleClaim);

// POST /api/referrals/apply { code } (alias)
router.post("/apply", requireUser, handleClaim);

export default router;
