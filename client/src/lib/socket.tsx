import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../../../shared/types";
import { createContext, useContext, useEffect, useState } from "react";
import React from "react";

const params = new URLSearchParams(window.location.search);
const customServer = params.get("server");

export const SOCKET_URL = customServer || import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
});

interface SocketContextState {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextState>({
  socket,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
