import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";

import meRouter from "./routes/me";
import googleAuthRouter from "./routes/auth.google";


dotenv.config();

const app = express();

// si luego usas cookies/sesión, esto ayuda
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// NO cambiar esto
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Google OAuth (nuevo)
app.use("/", googleAuthRouter);

// API existente
app.use("/api", meRouter);

export default app;
