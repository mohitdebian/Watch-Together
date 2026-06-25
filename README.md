# LiveWatch

LiveWatch is a production-ready "Watch Together" MVP that allows an Admin to stream a local video file (mp4, webm, mov) seamlessly to multiple viewers in real-time.

## Architecture & How Streaming Works
LiveWatch streams video directly from the Admin's browser without needing a heavy backend FFmpeg processing pipeline. 

1. **Admin side**: A local video file is loaded into the browser. When broadcasting begins, we use the `video.captureStream()` and `MediaRecorder` APIs to transcode the video playback on-the-fly into streamable WebM chunks (`video/webm; codecs=vp8,opus`).
2. **Transport**: These chunks are sent via `Socket.io` to the Node.js Express server, which acts as a lightweight relay to broadcast the chunks to all connected viewers.
3. **Viewer side**: Viewers receive the WebM chunks over Socket.io and feed them sequentially into an HTML5 `<video>` element using **MediaSource Extensions (MSE)**.

This guarantees smooth playback and perfect sync, regardless of the original video file format.

## Tech Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Node.js, Express, Socket.io
- **Streaming**: MediaRecorder, MediaSource Extensions (MSE)

## Installation & Running Locally

1. Install dependencies across all workspaces:
```bash
npm run install:all
```

2. Start both the client and server concurrently:
```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## Docker Deployment
You can run the entire application using Docker Compose.

```bash
docker-compose up --build
```

## Future Improvements
- **WebRTC**: Transition from Socket.io relay to WebRTC P2P mesh or SFU for lower latency and less server bandwidth.
- **Adaptive Bitrate Streaming (ABR)**: Implement multiple quality tiers.
- **Chat System**: Add real-time text chat for viewers.
- **Persistence**: Add PostgreSQL to save user sessions and past broadcasts.
