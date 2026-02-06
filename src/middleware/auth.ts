import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";

type JwtPayload = { uid?: string };

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.header("authorization") || req.header("Authorization") || "";

    // JWT
    if (auth.startsWith("Bearer ")) {
      const token = auth.slice("Bearer ".length).trim();
      const secret = (process.env.JWT_SECRET || "dev-secret-local") as jwt.Secret;

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, secret) as JwtPayload;
      } catch {
        return res.status(401).json({ error: "unauthorized" });
      }

      const uid = decoded?.uid;
      if (!uid) return res.status(401).json({ error: "unauthorized" });

      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (!user) return res.status(401).json({ error: "unauthorized" });

      (req as any).user = {
        id: user.id,
        sub: user.providerSub,
        email: user.email,
        name: user.name ?? "",
        provider: user.provider
      };

      return next();
    }

    // Dev headers
    const sub = req.header("x-user-sub") ?? "";
    const email = req.header("x-user-email") ?? "";
    const name = req.header("x-user-name") ?? "";

    if (!sub || !email) return res.status(401).json({ error: "unauthorized" });

    (req as any).user = { sub, email, name };
    return next();
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
}
