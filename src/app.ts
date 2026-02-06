import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";

import googleAuthRouter from "./routes/auth.google.js";
import meRouter from "./routes/me.js";
import referralsRouter from "./routes/referrals.js";

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// limiters
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const referralsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// aplica limiters ANTES de las rutas
app.use("/auth", authLimiter);

// NO cambiar esto
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Google OAuth
app.use("/", googleAuthRouter);

// API
app.use("/api", meRouter);

// Referrals (con limiter)
app.use("/api/referrals", referralsLimiter, referralsRouter);

export default app;
