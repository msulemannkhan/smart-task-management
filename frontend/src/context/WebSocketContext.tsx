import { createContext, useContext, type ReactNode } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

interface WebSocketContextValue {
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  sendMessage: (type: string, data: any) => boolean;
  lastMessage: any;
  connect: () => void;
  disconnect: () => void;
  reconnectAttempts: number;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const websocket = useWebSocket({
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  const contextValue: WebSocketContextValue = {
    ...websocket,
    reconnectAttempts: websocket.reconnectAttempts || 0,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider"
    );
  }
  return context;
}
