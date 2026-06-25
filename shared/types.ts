export interface StreamState {
  isLive: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  meta: {
    size: number;
    mimeType: string;
    name: string;
  } | null;
}

export interface ChatMessage {
  id: string;
  text: string;
  username: string;
  timestamp: number;
}

export interface ClientToServerEvents {
  "broadcast:start": (data: { duration: number }) => void;
  "broadcast:stop": () => void;
  "broadcast:pause": () => void;
  "broadcast:resume": () => void;
  "sync:time": (time: number) => void;
  
  // Relay events (Admin -> Server)
  "stream:meta": (meta: StreamState["meta"]) => void;
  "response:chunk": (data: { requestId: string; chunk: ArrayBuffer }) => void;

  // Chat
  "chat:send": (data: { text: string; username: string }) => void;
}

export interface ServerToClientEvents {
  "stream:status": (state: StreamState) => void;
  "viewer:count": (count: number) => void;
  "sync:time": (time: number) => void;
  
  // Relay events (Server -> Admin)
  "request:chunk": (req: { requestId: string; start: number; end: number }) => void;

  // Chat
  "chat:message": (msg: ChatMessage) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  isAdmin: boolean;
}
