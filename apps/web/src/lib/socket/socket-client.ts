import { io, type Socket } from "socket.io-client";
import { getSocketUrl } from "@/lib/config";

export type SocketConnectionState =
  | "connected"
  | "connecting"
  | "reconnecting"
  | "disconnected";

type StateListener = (state: SocketConnectionState) => void;
type QueueUpdateListener = (payload: {
  doctorId: string;
  clinicId: string;
  timestamp: string;
  data?: unknown;
}) => void;
type SlotBookedListener = (payload: {
  doctorId: string;
  clinicId: string;
  slotId: string;
  timestamp: string;
}) => void;

class SocketClientManager {
  private socket: Socket | null = null;
  private connectionState: SocketConnectionState = "disconnected";
  private stateListeners = new Set<StateListener>();
  private queueListeners = new Set<QueueUpdateListener>();
  private slotListeners = new Set<SlotBookedListener>();
  private activeDoctorRooms = new Set<string>();
  private isConnecting = false;

  private setState(next: SocketConnectionState) {
    if (this.connectionState !== next) {
      this.connectionState = next;
      this.stateListeners.forEach((l) => l(next));
    }
  }

  public getState(): SocketConnectionState {
    return this.connectionState;
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.connectionState);
    return () => this.stateListeners.delete(listener);
  }

  public subscribeQueueUpdates(listener: QueueUpdateListener): () => void {
    this.queueListeners.add(listener);
    return () => this.queueListeners.delete(listener);
  }

  public subscribeSlotBooked(listener: SlotBookedListener): () => void {
    this.slotListeners.add(listener);
    return () => this.slotListeners.delete(listener);
  }

  /**
   * Fetch short-lived socket authentication token from BFF
   */
  private async fetchSocketToken(): Promise<string | null> {
    try {
      const res = await fetch("/api/auth/socket-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data?.socketToken || null;
    } catch {
      return null;
    }
  }

  /**
   * Initialize or retrieve the active Socket.IO connection
   */
  public async connect(): Promise<Socket | null> {
    if (typeof window === "undefined") return null;

    if (this.socket?.connected) {
      this.setState("connected");
      return this.socket;
    }

    if (this.isConnecting) return null;
    this.isConnecting = true;
    this.setState("connecting");

    const token = await this.fetchSocketToken();
    if (!token) {
      this.isConnecting = false;
      this.setState("disconnected");
      return null;
    }

    const socketUrl = getSocketUrl();

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      this.isConnecting = false;
      this.setState("connected");

      // Re-join active doctor rooms
      this.activeDoctorRooms.forEach((docId) => {
        this.socket?.emit("join:doctor-queue", docId);
      });
    });

    this.socket.on("disconnect", (reason) => {
      this.setState("disconnected");
      if (reason === "io server disconnect") {
        // the disconnection was initiated on the server, reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on("connect_error", () => {
      this.setState("reconnecting");
    });

    this.socket.on("queue:updated", (payload) => {
      this.queueListeners.forEach((l) => l(payload));
    });

    this.socket.on("slot:booked", (payload) => {
      this.slotListeners.forEach((l) => l(payload));
    });

    this.isConnecting = false;
    return this.socket;
  }

  public joinDoctorQueue(doctorId: string): void {
    this.activeDoctorRooms.add(doctorId);
    if (this.socket?.connected) {
      this.socket.emit("join:doctor-queue", doctorId);
    }
  }

  public leaveDoctorQueue(doctorId: string): void {
    this.activeDoctorRooms.delete(doctorId);
    if (this.socket?.connected) {
      this.socket.emit("leave:doctor-queue", doctorId);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeDoctorRooms.clear();
    this.setState("disconnected");
  }
}

export const socketManager = new SocketClientManager();
