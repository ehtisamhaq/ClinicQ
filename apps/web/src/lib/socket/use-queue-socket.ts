"use client";

import * as React from "react";
import { socketManager, type SocketConnectionState } from "./socket-client";

interface UseQueueSocketOptions {
  doctorId?: string;
  onRefresh?: () => void;
  pollingIntervalMs?: number;
}

export function useQueueSocket({
  doctorId,
  onRefresh,
  pollingIntervalMs = 15000,
}: UseQueueSocketOptions = {}) {
  const [connectionState, setConnectionState] =
    React.useState<SocketConnectionState>("disconnected");

  // Keep onRefresh ref current
  const refreshRef = React.useRef(onRefresh);
  React.useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  // Connect and subscribe on mount
  React.useEffect(() => {
    socketManager.connect();
    const unsubState = socketManager.subscribeState(setConnectionState);

    if (doctorId) {
      socketManager.joinDoctorQueue(doctorId);
    }

    const unsubQueue = socketManager.subscribeQueueUpdates((payload) => {
      if (!doctorId || payload.doctorId === doctorId) {
        refreshRef.current?.();
      }
    });

    return () => {
      unsubState();
      unsubQueue();
      if (doctorId) {
        socketManager.leaveDoctorQueue(doctorId);
      }
    };
  }, [doctorId]);

  // Fallback polling when disconnected or reconnecting
  React.useEffect(() => {
    if (connectionState === "connected") return;

    const interval = setInterval(() => {
      refreshRef.current?.();
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [connectionState, pollingIntervalMs]);

  return {
    connectionState,
    isLive: connectionState === "connected",
    isReconnecting: connectionState === "reconnecting",
  };
}
