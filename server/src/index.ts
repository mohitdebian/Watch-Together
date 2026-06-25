import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { randomUUID } from "crypto";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  StreamState,
} from "../../shared/types";
import type { ChatMessage } from "../../shared/types";

const app = express();
app.use(cors());

let broadcasterId: string | null = null;
let viewers = new Set<string>();

let streamState: StreamState = {
  isLive: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  meta: null,
};

const pendingRequests = new Map<string, express.Response>();

app.get('/', (req, res) => {
  res.send('LiveWatch Backend is running!');
});

// HTTP Relay Endpoint
app.get('/api/stream', (req, res) => {
  if (!streamState.isLive || !streamState.meta || !broadcasterId) {
    res.status(404).send("No active stream");
    return;
  }

  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
    return;
  }

  const size = streamState.meta.size;
  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  // Default to 1MB chunks to ensure quick response and smooth relay
  const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 10 ** 6 - 1, size - 1); 
  
  if (start >= size || end >= size) {
    res.status(416).send("Requested range not satisfiable");
    return;
  }

  const chunksize = (end - start) + 1;

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunksize,
    "Content-Type": streamState.meta.mimeType,
  });

  const requestId = randomUUID();
  pendingRequests.set(requestId, res);

  req.on("close", () => {
    pendingRequests.delete(requestId);
  });

  // Request the chunk from the Admin
  io.to(broadcasterId).emit("request:chunk", { requestId, start, end });
});

const server = http.createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8, // Allow large chunks (100 MB)
});

function broadcastState() {
  io.emit("stream:status", streamState);
}

function broadcastViewerCount() {
  io.emit("viewer:count", viewers.size);
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send current state
  socket.emit("stream:status", streamState);
  
  // Track viewer
  viewers.add(socket.id);
  broadcastViewerCount();

  socket.on("stream:meta", (meta) => {
    // Only allow setting meta if they are the broadcaster, or if there is no active broadcaster
    if (broadcasterId && socket.id !== broadcasterId) return;
    streamState.meta = meta;
    broadcastState();
  });

  socket.on("broadcast:start", (data) => {
    if (broadcasterId && broadcasterId !== socket.id) {
      console.log(`Socket ${socket.id} tried to broadcast but ${broadcasterId} is already broadcasting`);
      return;
    }

    broadcasterId = socket.id;
    viewers.delete(socket.id);
    broadcastViewerCount();

    streamState.isLive = true;
    streamState.isPaused = false;
    streamState.currentTime = 0;
    streamState.duration = data.duration;
    
    console.log(`Broadcast started by ${socket.id}`);
    broadcastState();
  });

  socket.on("broadcast:stop", () => {
    if (socket.id !== broadcasterId) return;

    streamState.isLive = false;
    streamState.isPaused = false;
    streamState.currentTime = 0;
    streamState.duration = 0;
    streamState.meta = null;
    broadcasterId = null;

    // Abort pending requests
    for (const [id, res] of pendingRequests.entries()) {
      res.end();
    }
    pendingRequests.clear();

    console.log(`Broadcast stopped by ${socket.id}`);
    broadcastState();
  });

  socket.on("broadcast:pause", () => {
    if (socket.id !== broadcasterId) return;
    streamState.isPaused = true;
    broadcastState();
  });

  socket.on("broadcast:resume", () => {
    if (socket.id !== broadcasterId) return;
    streamState.isPaused = false;
    broadcastState();
  });

  socket.on("sync:time", (time) => {
    if (socket.id !== broadcasterId) return;
    streamState.currentTime = time;
    socket.broadcast.emit("sync:time", time);
  });

  socket.on("response:chunk", (data) => {
    if (socket.id !== broadcasterId) return;
    
    const res = pendingRequests.get(data.requestId);
    if (res) {
      res.write(Buffer.from(data.chunk));
      res.end();
      pendingRequests.delete(data.requestId);
    }
  });

  socket.on("chat:send", (data) => {
    const msg = {
      id: randomUUID(),
      text: data.text,
      username: data.username,
      timestamp: Date.now(),
    };
    io.emit("chat:message", msg);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.id === broadcasterId) {
      streamState.isLive = false;
      streamState.isPaused = false;
      streamState.currentTime = 0;
      streamState.duration = 0;
      streamState.meta = null;
      broadcasterId = null;
      
      for (const [id, res] of pendingRequests.entries()) {
        res.end();
      }
      pendingRequests.clear();
      
      broadcastState();
      console.log("Broadcaster disconnected. Stream ended.");
    } else {
      viewers.delete(socket.id);
      broadcastViewerCount();
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
