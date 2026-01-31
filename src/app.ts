import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import meRouter from "./routes/me.js";

dotenv.config();

const app = express();
app.use(cors());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", meRouter);

export default app;
