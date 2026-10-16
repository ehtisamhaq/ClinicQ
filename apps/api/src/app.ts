import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./app/config/env";
import { globalErrorHandler, notFound } from "./app/errors/errorHandler";
import rootRouter from "./app/routes/index";
import pino from "pino";

// ─── Logger ───────────────────────────────────────────────────────────────────
// API runs on Render (standard Node.js) — NOT on Vercel Edge.
// Pino is fully supported here: it writes single-line JSON to stdout,
// which Render (and any 12-factor host) captures automatically.
// No file transport, no worker threads needed.
//
// ⚠️  Do NOT use Pino inside Next.js Edge Middleware or Vercel Edge Functions —
//     those environments forbid the Node.js `vm` module that fast-redact needs.
//     For web-side logging (apps/web) use a plain console.error wrapper instead.
const logger = pino({
  level: env.LOG_LEVEL,
  name: "clinicq-api",
  // Write clean, single-line JSON to stdout — the platform captures it.
  // Omit the `transport` key entirely so Pino uses its fast default pipeline.
});

export const app: Express = express();

// Security headers
app.use(helmet());

// CORS — explicit allowlist, credentials for httpOnly cookie BFF pattern
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  }),
);

// Body parsing — limit size to prevent payload attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Structured request logging — redact secrets at the serializer level,
// never in transit, so the raw token never appears in log output.
app.use(
  pinoHttp({
    logger,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.body.password",
        "req.body.refreshToken",
        "req.body.newPassword",
        "req.body.currentPassword",
      ],
      censor: "[REDACTED]",
    },
  }),
);

// Routes — mount under /api/v1, /api, and / as fallback
app.use("/api/v1", rootRouter);
app.use("/api", rootRouter);
app.use("/", rootRouter);

// 404 handler (registered after all routes)
app.use(notFound);

// Global error handler (must have 4 params: err, req, res, next)
app.use(globalErrorHandler);

export default app;
