import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DarkModeToggle } from '../../shared/hooks/useDarkMode';
import { LogIn, Sparkles, Book, Box, LayoutDashboard } from 'lucide-react';

export function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const rotatingItems = [
    { label: 'MANAGE', icon: LayoutDashboard, color: 'text-accent-primary' },
    { label: 'SHOWCASE', icon: Box, color: 'text-accent-primary' }
  ];

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const currentItem = rotatingItems[index];

  return (
    <div className="relative min-h-[100dvh] overflow-hidden flex flex-col items-center justify-center p-4 sm:p-12">
      {/* Dynamic Solar Background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.08)_0%,_transparent_70%)]" />
      
      {/* Floating Blobs and Flares */}
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          rotate: [0, 90, 0],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent-primary blur-[120px] -z-10"
      />
      <motion.div
        animate={{
          scale: [1.3, 1, 1.3],
          rotate: [0, -45, 0],
          opacity: [0.2, 0.05, 0.2],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-15%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-accent-soft blur-[150px] -z-10"
      />

      {/* Interactive Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          className="absolute w-2 h-2 rounded-full bg-accent-soft blur-[2px] hidden sm:block"
          style={{
            top: `${20 + i * 12}%`,
            left: `${15 + (i % 3) * 30}%`,
          }}
        />
      ))}

      {/* Rotating Solar Rings */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-accent-primary/5 rounded-full -z-20 hidden lg:block"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-accent-soft/5 rounded-full -z-20 hidden lg:block"
      />

      {/* Top Right Controls */}
      <div className="absolute top-8 right-8 z-50">
        <DarkModeToggle />
      </div>

      <div className="max-w-3xl w-full text-center space-y-6 sm:space-y-16 flex-1 flex flex-col justify-center">
        <header className="space-y-3 sm:space-y-6">
          <div className="overflow-visible">
            <motion.h2
              className="text-2xl sm:text-7xl font-bold text-text-main leading-[1.3] tracking-tighter text-center"
            >
              <div className="flex flex-col items-center justify-center">
                <div className="h-[1.5em] relative w-full flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      initial={{ y: 60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -60, opacity: 0 }}
                      transition={{ 
                        duration: 0.6, 
                        ease: [0.22, 1, 0.36, 1] 
                      }}
                      className={`flex items-center justify-center gap-3 sm:gap-6 ${currentItem.color} font-display`}
                    >
                      <div className="w-8 h-8 sm:w-16 sm:h-16 bg-accent-primary rounded-full flex items-center justify-center shadow-lg shadow-accent-primary/20 rotate-12 group-hover:rotate-0 transition-transform">
                        <currentItem.icon className="text-white w-4 h-4 sm:w-8 sm:h-8" strokeWidth={2.5} />
                      </div>
                      <span className="tracking-[0.1em]">{currentItem.label}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>
                
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="block text-sm sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-text-main via-text-muted to-text-main font-black uppercase tracking-[0.2em] mt-1 sm:mt-4"
                >
                  Your Collection.
                </motion.span>
              </div>
            </motion.h2>
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-[13px] sm:text-xl text-text-muted max-w-xs sm:max-w-lg mx-auto leading-relaxed font-light text-center px-4"
          >
            Effortlessly manage, monitor, and showcase your gallery. Track your hobby expenses and display your figures in one virtual gallery.
          </motion.p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={login}
            className="w-full sm:w-auto px-6 py-3 sm:px-12 sm:py-5 bg-accent-primary text-white rounded-2xl font-black text-base sm:text-xl flex items-center justify-center gap-2 sm:gap-4 transition-all shadow-xl shadow-accent-primary/10"
          >
            <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
            ENTER GALLERY
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-12 pt-6 sm:pt-20 border-t border-border-subtle"
        >
          {[
            { icon: Sparkles, label: "MANAGE & MONITOR", desc: "Keep a real-time eye on your entire record of figures and equipment." },
            { icon: Book, label: "EXPENSE TRACKING", desc: "Monitor every hobby investment from figures to shelving costs." },
            { icon: Box, label: "UNIFIED SHOWCASE", desc: "Exhibit your curated gallery in one bold, shareable public gallery." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="space-y-2 sm:space-y-4 group"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-bg-card flex items-center justify-center mx-auto group-hover:bg-accent-primary/10 transition-colors">
                <item.icon className="w-4 h-4 sm:w-6 sm:h-6 text-accent-primary" />
              </div>
              <h3 className="font-black text-text-main text-[10px] sm:text-sm uppercase tracking-[0.2em]">{item.label}</h3>
              <p className="text-[10px] sm:text-xs text-text-muted leading-relaxed px-4 hidden sm:block">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <footer className="py-8 sm:mt-24 text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-text-muted/40 shrink-0">
        © {new Date().getFullYear()} — KuraDex Gallery
      </footer>
    </div>
  );
}
