"use client";

import { io, type Socket } from "socket.io-client";
import { getToken } from "./api";

let socket: Socket | null = null;

export function getLiveSocket() {
  if (socket) return socket;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000/live";
  socket = io(url, { transports: ["websocket"], auth: { token: getToken() } });
  return socket;
}
