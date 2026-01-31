import type { Request, Response, NextFunction } from "express";

export function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sub = req.header("x-user-sub") ?? "";
  const email = req.header("x-user-email") ?? "";
  const name = req.header("x-user-name") ?? "";

  if (!sub || !email) {
    return res.status(401).json({ error: "unauthorized" });
  }

  (req as any).user = { sub, email, name };
  return next();
}
