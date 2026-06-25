import React, { useRef, useState, useEffect } from "react";
import { useSocket } from "../lib/socket";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Play, Pause, Square, Users, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { ChatOverlay } from "../components/ChatOverlay";

export function AdminPage() {
  const { socket, isConnected } = useSocket();
  const [file, setFile] = useState<File | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    socket.on("viewer:count", setViewerCount);
    return () => {
      socket.off("viewer:count", setViewerCount);
    };
  }, [socket]);

  // Handle incoming HTTP Relay chunk requests
  useEffect(() => {
    const handleChunkRequest = async ({ requestId, start, end }: { requestId: string, start: number, end: number }) => {
      if (!file) return;
      try {
        const blob = file.slice(start, end + 1);
        const buffer = await blob.arrayBuffer();
        socket.emit("response:chunk", { requestId, chunk: buffer });
      } catch (e) {
        console.error("Error reading file chunk", e);
      }
    };

    socket.on("request:chunk", handleChunkRequest);
    return () => {
      socket.off("request:chunk", handleChunkRequest);
    };
  }, [socket, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(selectedFile);
      }
    }
  };

  const startBroadcast = () => {
    if (!videoRef.current || !file) return;

    setIsBroadcasting(true);
    setIsPaused(false);
    
    // Send file metadata to backend so it can accept HTTP GET requests
    socket.emit("stream:meta", {
      size: file.size,
      mimeType: file.type || "video/mp4",
      name: file.name
    });

    socket.emit("broadcast:start", { duration: videoRef.current.duration });
    
    videoRef.current.play().catch((err) => {
      console.error("Auto-play prevented or file not supported:", err);
      // If the browser can't play the file, we must stop the broadcast
      stopBroadcast();
      alert("Error: Your browser does not support the video or audio codec in this file. Please try an MP4 file instead.");
    });

    // Time sync loop
    const syncInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        socket.emit("sync:time", videoRef.current.currentTime);
      }
    }, 2000);

    return () => clearInterval(syncInterval);
  };

  const stopBroadcast = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsBroadcasting(false);
    setIsPaused(false);
    socket.emit("broadcast:stop");
  };

  const togglePause = () => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handlePlay = () => {
    if (isBroadcasting && isPaused) {
      setIsPaused(false);
      socket.emit("broadcast:resume");
    }
  };

  const handlePause = () => {
    if (isBroadcasting && !isPaused) {
      setIsPaused(true);
      socket.emit("broadcast:pause");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Broadcast</h1>
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <div className="flex items-center gap-2 text-white/60">
              <Users size={18} />
              <span>{viewerCount} viewers</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player Area */}
            <Card className="bg-white/5 border-white/10 overflow-hidden backdrop-blur-md">
              <div className="relative aspect-video bg-black/50 flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-contain"
                  controls
                  onPlay={handlePlay}
                  onPause={handlePause}
                />
                
                {isBroadcasting && <ChatOverlay username="Admin" />}

                {!file && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                    <Upload size={48} className="mb-4" />
                    <p>Select a video to preview</p>
                  </div>
                )}
              </div>
              
              {file && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
                  <div className="truncate pr-4">
                    <p className="font-medium text-white truncate">{file.name}</p>
                    <p className="text-sm text-white/60">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!isBroadcasting ? (
                      <Button onClick={startBroadcast} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Play className="mr-2 h-4 w-4" /> Start Broadcast
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={togglePause} 
                          variant="outline" 
                          className="border-white/20 hover:bg-white/10"
                        >
                          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </Button>
                        <Button onClick={stopBroadcast} variant="destructive">
                          <Square className="mr-2 h-4 w-4" /> Stop
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            {/* Upload Area */}
            <Card className="bg-white/5 border-white/10 p-6 backdrop-blur-md">
              <h3 className="text-lg font-semibold mb-4">Source Video</h3>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mkv" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isBroadcasting}
                />
                <Upload className="mx-auto mb-4 text-white/40" size={32} />
                <p className="text-sm text-white/60">Drag & drop or click to select</p>
                <p className="text-xs text-white/40 mt-2">MP4, WebM, MOV, MKV</p>
              </div>
            </Card>

            {/* Stream Stats */}
            {isBroadcasting && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-white/5 border-white/10 p-6 backdrop-blur-md space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="text-green-500 animate-pulse" size={20} />
                    <h3 className="font-semibold">Stream Status</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Status</span>
                      <span className={isPaused ? "text-yellow-500" : "text-green-500"}>
                        {isPaused ? "Paused" : "LIVE"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Delivery</span>
                      <span className="text-blue-400">P2P HTTP Relay</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Format</span>
                      <span>Native Source File</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
