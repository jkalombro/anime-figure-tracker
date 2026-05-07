import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { cn } from '../utils/utils';

interface FullscreenGalleryProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  accentColor?: string;
}

export function FullscreenGallery({
  images,
  initialIndex = 0,
  onClose,
  accentColor = "var(--color-accent-primary)"
}: FullscreenGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [scale, setScale] = useState(1);
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Motion values for drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Function to calculate drag constraints based on scaled image versus viewport
  const calculateConstraints = () => {
    if (!imageRef.current || scale <= 1) {
      setConstraints({ left: 0, right: 0, top: 0, bottom: 0 });
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }
    
    // We need the "unscaled" dimensions of the image as it sits in the layout
    const baseWidth = imageRef.current.clientWidth;
    const baseHeight = imageRef.current.clientHeight;
    
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;
    
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Available room to move is (Total Scaled Size - Viewport Size) / 2
    // We also add a small buffer (10px) to ensure edges are fully reachable
    const xLimit = Math.max(0, (scaledWidth - vw) / 2);
    const yLimit = Math.max(0, (scaledHeight - vh) / 2);

    const newConstraints = {
      left: -xLimit,
      right: xLimit,
      top: -yLimit,
      bottom: yLimit
    };
    setConstraints(newConstraints);
    return newConstraints;
  };

  // Clamps x and y to current constraints
  const clampPosition = (currentConstraints: typeof constraints) => {
    const currentX = x.get();
    const currentY = y.get();

    const newX = Math.min(Math.max(currentX, currentConstraints.left), currentConstraints.right);
    const newY = Math.min(Math.max(currentY, currentConstraints.top), currentConstraints.bottom);

    if (newX !== currentX) x.set(newX);
    if (newY !== currentY) y.set(newY);
  };

  // Reset zoom and position when changing images
  useEffect(() => {
    setScale(1);
    x.set(0);
    y.set(0);
    setConstraints({ left: 0, right: 0, top: 0, bottom: 0 });
  }, [currentIndex, x, y]);

  // Handle constraints and clamping when scale changes
  useEffect(() => {
    const newConstraints = calculateConstraints();
    clampPosition(newConstraints);
  }, [scale]);

  // Recalculate on window resize
  useEffect(() => {
    window.addEventListener('resize', calculateConstraints);
    return () => window.removeEventListener('resize', calculateConstraints);
  }, [scale]);

  // Handle pinch-to-zoom and constraints
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startDist = 0;
    let startScale = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startDist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        startScale = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist > 0) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        const newScale = Math.min(Math.max(startScale * (dist / startDist), 1), 4);
        setScale(newScale);
      }
    };

    const handleTouchEnd = () => {
      startDist = 0;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale]);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = images.length - 1;
      if (next >= images.length) next = 0;
      return next;
    });
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    if (newScale === 1) {
      x.set(0);
      y.set(0);
    }
  };

  const toggleZoom = () => {
    if (scale > 1) {
      setScale(1);
      x.set(0);
      y.set(0);
    } else {
      setScale(2);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden touch-none"
      >
        {/* Top Controls */}
        <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
             <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all border border-white/10 disabled:opacity-20"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 sm:w-6 h-6" />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all border border-white/10 disabled:opacity-20"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 sm:w-6 h-6" />
            </button>
            <button
              onClick={toggleZoom}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all border border-white/10"
              title={scale > 1 ? "Reset Zoom" : "Quick Zoom"}
            >
              <Maximize className="w-5 h-5 sm:w-6 h-6" />
            </button>
            <span className="ml-2 text-[10px] sm:text-xs font-black text-white/40 uppercase tracking-widest hidden sm:inline">
              Scale: {scale.toFixed(1)}x
            </span>
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all border border-white/10"
          >
            <X className="w-5 h-5 sm:w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="relative w-full h-full flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 flex items-center justify-center p-4 sm:p-20 overflow-hidden"
            >
              <motion.div
                style={{ x, y, scale }}
                drag={scale > 1}
                dragConstraints={constraints}
                dragElastic={0.1}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className={cn(
                  "relative max-w-full max-h-full flex items-center justify-center",
                  scale > 1 ? "cursor-move" : "cursor-default"
                )}
              >
                <img
                  ref={imageRef}
                  src={images[currentIndex]}
                  alt=""
                  className="max-w-full max-h-[85vh] object-contain select-none pointer-events-none rounded shadow-2xl"
                  referrerPolicy="no-referrer"
                  onDoubleClick={toggleZoom}
                  onLoad={calculateConstraints}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          {images.length > 1 && scale === 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all z-[60] group"
              >
                <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 group-hover:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); paginate(1); }}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all z-[60] group"
              >
                <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Metadata */}
        <div className="absolute bottom-0 inset-x-0 p-10 flex flex-col items-center gap-4 bg-gradient-to-t from-black/50 to-transparent z-50">
          <div className="flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (scale === 1) setCurrentIndex(idx);
                }}
                className={cn(
                  "h-1 sm:h-1.5 rounded-full transition-all duration-300",
                  idx === currentIndex 
                    ? "w-8" 
                    : "w-2 bg-white/20 hover:bg-white/40"
                )}
                style={{
                  backgroundColor: idx === currentIndex ? accentColor : undefined
                }}
              />
            ))}
          </div>
          <p className="text-white/40 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
            FILE {currentIndex + 1} / {images.length}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
