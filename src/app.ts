import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import googleAuthRouter from "./routes/auth.google.js";
import meRouter from "./routes/me.js";
import referralsRouter from "./routes/referrals.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/", googleAuthRouter);
app.use("/api", meRouter);
app.use("/api/referrals", referralsRouter);

export default app;
