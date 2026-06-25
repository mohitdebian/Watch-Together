import React, { useState, useEffect } from "react";
import { useSocket } from "../lib/socket";
import type { ChatMessage } from "../../../shared/types";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatOverlayProps {
  username?: string;
}

interface DisplayMessage extends ChatMessage {
  top: string;
  left: string;
}

export function ChatOverlay({ username = "Viewer" }: ChatOverlayProps) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState("");
  
  // Create a random username if it's just "Viewer"
  const [localUsername] = useState(() => 
    username === "Viewer" ? `Viewer_${Math.floor(Math.random() * 1000)}` : username
  );

  useEffect(() => {
    const handleNewMessage = (msg: ChatMessage) => {
      // Generate a random position for the popup
      // Restrict it between 10% and 75% to prevent it from rendering off-screen
      const top = `${Math.floor(Math.random() * 65) + 10}%`; 
      const left = `${Math.floor(Math.random() * 60) + 10}%`;

      const displayMsg: DisplayMessage = { ...msg, top, left };
      
      setMessages((prev) => [...prev, displayMsg]);

      // Automatically remove the popup after 6 seconds
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 6000);
    };

    socket.on("chat:message", handleNewMessage);
    return () => {
      socket.off("chat:message", handleNewMessage);
    };
  }, [socket]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socket.emit("chat:send", {
      text: inputText.trim(),
      username: localUsername,
    });
    
    setInputText("");
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
      {/* Floating Messages Area */}
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ top: msg.top, left: msg.left }}
            className="absolute pointer-events-none flex items-center text-lg md:text-xl font-medium"
          >
            {/* Fully transparent background, using heavy drop-shadows so text is readable over the video */}
            <span 
              className="text-white" 
              style={{ textShadow: "0px 1px 8px rgba(0,0,0,0.9), 0px 0px 3px rgba(0,0,0,0.8)" }}
            >
              {msg.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Input Area (Bottom Right) */}
      <div className="absolute bottom-16 right-4 pointer-events-auto">
        <form 
          onSubmit={handleSend} 
          className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-xl focus-within:bg-black/60 transition-colors"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="w-48 bg-transparent text-sm text-white placeholder-white/50 focus:outline-none px-2 py-1"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
