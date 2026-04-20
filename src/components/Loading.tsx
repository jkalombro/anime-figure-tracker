import { motion } from 'motion/react';
import { Box, Sparkles } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-bg-deep z-[100] flex flex-col items-center justify-center">
      {/* Creative Loader */}
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-3xl border-2 border-accent-primary/20 border-t-accent-primary"
        />
        
        {/* Floating Icons */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <Box className="w-10 h-10 text-accent-primary" strokeWidth={1.5} />
            
            {/* Scanning Line */}
            <motion.div
              animate={{ 
                top: ["10%", "90%", "10%"],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-0.5 bg-accent-soft/60 shadow-[0_0_10px_rgba(16,185,129,0.5)] z-10"
            />
          </motion.div>
        </div>

        {/* Orbiting particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 3 + i, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-accent-soft rounded-full -ml-1 -mt-1 blur-[1px]"
            style={{ 
              translateX: `${30 + i * 15}px`,
              opacity: 0.6
            }}
          />
        ))}
      </div>

      <div className="mt-12 text-center space-y-2">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-text-main font-bold tracking-[0.2em] uppercase text-sm"
        >
          Preparing Gallery
        </motion.p>
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex justify-center gap-1"
        >
          <div className="w-1 h-1 bg-accent-primary rounded-full" />
          <div className="w-1 h-1 bg-accent-primary rounded-full delay-150" />
          <div className="w-1 h-1 bg-accent-primary rounded-full delay-300" />
        </motion.div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ className = "w-6 h-6", variant = "brand" }: { className?: string, variant?: "brand" | "white" }) {
  const colorClass = variant === "white" ? "border-white" : "border-accent-primary";
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${className} border-2 ${colorClass} border-t-transparent rounded-full`}
    />
  );
}
