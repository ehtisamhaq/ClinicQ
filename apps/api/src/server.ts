import http from "http";
import { app } from "./app";
import { env } from "./app/config/env";
import prisma, { pool } from "./lib/prisma";
import { initSocketIO } from "./socket";

const server = http.createServer(app);
const io = initSocketIO(server);

async function start() {
  // Test database connection before accepting traffic
  await prisma.$connect();
  console.log("✅ Database connected");

  server.listen(env.PORT, () => {
    console.log(`🚀 ClinicQ API running on port ${env.PORT} [${env.NODE_ENV}] (Socket.IO enabled)`);
  });
}

// Graceful shutdown — close DB connections and drain in-flight requests
async function shutdown(signal: string) {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  io.close();
  server.close(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log("✅ Server closed and DB disconnected");
    process.exit(0);
  });
  // Force exit after 10 s if something is stuck
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  // Don't exit; let the error propagate naturally in dev, log in production
});

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
