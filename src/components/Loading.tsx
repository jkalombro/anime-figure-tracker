import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-text-main font-medium tracking-wide"
      >
        Loading Figdex Gallery...
      </motion.p>
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
