import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Video, Tv, Users } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-primary-foreground">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
            LiveWatch v1.0 is here
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
            Watch Together. <br className="hidden md:block" />
            Anywhere, Anytime.
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Stream local video files seamlessly to your friends in real-time. No downloads, no sign-ups, just pure synchronized viewing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/broadcast">
              <Button size="lg" className="h-14 px-8 text-lg rounded-xl bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
                <Video className="mr-2 h-5 w-5" />
                Start Broadcasting
              </Button>
            </Link>
            <Link to="/watch">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all hover:scale-105">
                <Tv className="mr-2 h-5 w-5" />
                Watch Stream
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto w-full"
        >
          {[
            { icon: Video, title: "High Quality", desc: "Stream your local mp4, webm, or mov files directly without quality loss." },
            { icon: Users, title: "Sync Playback", desc: "Everyone stays in perfect sync. Join late and start exactly where the host is." },
            { icon: Tv, title: "No Latency", desc: "Experience real-time viewing with WebSockets and MediaSource Extensions." }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-left">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
