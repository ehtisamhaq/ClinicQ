import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { env } from "./app/config/env";
import { verifyAccessToken, verifySocketToken } from "./app/utils/jwt";

let ioInstance: Server | null = null;

export function initSocketIO(server: HttpServer): Server {
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Authentication handshake middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return next(new Error("Authentication required for WebSocket connection"));
    }

    try {
      // Allow either socket-specific short-lived token or standard access token
      let payload;
      try {
        payload = verifySocketToken(token);
      } catch {
        payload = verifyAccessToken(token);
      }

      socket.data.user = {
        id: payload.sub,
        role: payload.role,
        clinicId: payload.clinicId,
      };

      next();
    } catch {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;

    // Join user-specific and clinic-specific rooms
    if (user?.id) {
      socket.join(`user:${user.id}`);
    }
    if (user?.clinicId) {
      socket.join(`clinic:${user.clinicId}`);
    }

    // Client requests to join/leave doctor queue room
    socket.on("join:doctor-queue", (doctorId: string) => {
      if (typeof doctorId === "string" && doctorId.length > 0) {
        socket.join(`doctor:${doctorId}`);
      }
    });

    socket.on("leave:doctor-queue", (doctorId: string) => {
      if (typeof doctorId === "string") {
        socket.leave(`doctor:${doctorId}`);
      }
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): Server | null {
  return ioInstance;
}

/**
 * Emits queue:updated to all sockets subscribed to the doctor's queue and clinic room.
 */
export function emitQueueUpdated(doctorId: string, clinicId: string, data?: unknown): void {
  if (!ioInstance) return;
  ioInstance.to(`doctor:${doctorId}`).to(`clinic:${clinicId}`).emit("queue:updated", {
    doctorId,
    clinicId,
    timestamp: new Date().toISOString(),
    data,
  });
}

/**
 * Emits slot:booked to notify clients that a slot is taken.
 */
export function emitSlotBooked(doctorId: string, clinicId: string, slotId: string): void {
  if (!ioInstance) return;
  ioInstance.to(`doctor:${doctorId}`).to(`clinic:${clinicId}`).emit("slot:booked", {
    doctorId,
    clinicId,
    slotId,
    timestamp: new Date().toISOString(),
  });
}
