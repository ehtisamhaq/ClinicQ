import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./app/config/env";
import { globalErrorHandler, notFound } from "./app/errors/errorHandler";
import rootRouter from "./app/routes/index";
import pino from "pino";

const logger = pino({ level: env.LOG_LEVEL, name: "clinicq-api" });

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

// Structured request logging (no secrets/passwords logged)
app.use(
  pinoHttp({
    logger,
    redact: ["req.headers.authorization", "req.body.password", "req.body.refreshToken"],
  }),
);

// Routes
app.use("/api", rootRouter);

// 404 handler (registered after all routes)
app.use(notFound);

// Global error handler (must have 4 params: err, req, res, next)
app.use(globalErrorHandler);

export default app;
