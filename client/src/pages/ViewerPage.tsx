import React, { useEffect, useRef, useState } from "react";
import { useSocket, SOCKET_URL } from "../lib/socket";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, Wifi, Play, Volume2, VolumeX, Maximize } from "lucide-react";
import { ChatOverlay } from "../components/ChatOverlay";

export function ViewerPage() {
  const { socket, isConnected } = useSocket();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Audio controls state
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    socket.on("stream:status", (state) => {
      setIsLive(state.isLive);
      
      if (videoRef.current && state.isLive) {
        if (state.isPaused) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(e => console.error("Auto-play prevented", e));
        }
      }
    });

    socket.on("viewer:count", setViewerCount);

    socket.on("sync:time", (time) => {
      if (videoRef.current) {
        const diff = Math.abs(videoRef.current.currentTime - time);
        // Only force sync if they are more than 2 seconds out of sync
        if (diff > 2) {
          console.log("Syncing time", time);
          videoRef.current.currentTime = time;
        }
      }
    });

    return () => {
      socket.off("stream:status");
      socket.off("viewer:count");
      socket.off("sync:time");
    };
  }, [socket]);

  // Volume Handlers
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Play className="text-blue-500" /> LiveWatch
          </h1>
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "destructive"} className="bg-white/10">
              <Wifi className="mr-1 h-3 w-3" />
              {isConnected ? "Connected" : "Offline"}
            </Badge>
            <div className="flex items-center gap-2 text-white/60">
              <Users size={18} />
              <span>{viewerCount} viewers</span>
            </div>
          </div>
        </header>

        <Card className="bg-white/5 border-white/10 overflow-hidden backdrop-blur-md relative">
          <div ref={wrapperRef} className="aspect-video bg-black flex items-center justify-center relative group">
            {isLive ? (
              <>
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-contain"
                  src={`${SOCKET_URL}/api/stream`}
                  autoPlay
                  playsInline
                  onClick={toggleFullscreen}
                />
                
                {/* Top Overlay */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <Badge variant="destructive" className="animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                    LIVE
                  </Badge>
                </div>

                <ChatOverlay />

                {/* Custom Control Bar (appears on hover) */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between z-30">
                  <div className="flex items-center gap-4">
                    <button onClick={toggleMute} className="text-white hover:text-white/80 transition">
                      {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={isMuted ? 0 : volume} 
                      onChange={handleVolumeChange}
                      className="w-24 accent-blue-500 cursor-pointer"
                    />
                  </div>
                  
                  <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition">
                    <Maximize size={24} />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-white/50 space-y-4">
                <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                  <Wifi className="w-10 h-10 opacity-50" />
                </div>
                <p className="text-xl">No one is live right now.</p>
                <p className="text-sm">Wait here, the stream will start automatically.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
