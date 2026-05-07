import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { cn } from '../utils/utils';

interface FullscreenGalleryProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  accentColor?: string;
}

interface FullscreenSlideProps {
  src: string;
  onZoomChange?: (isZoomed: boolean) => void;
}

function FullscreenSlide({ src, onZoomChange }: FullscreenSlideProps) {
  const [scale, setScale] = useState(1);
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const calculateConstraints = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    const runUpdate = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (!nw || !nh) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Calculate how the image fits in the viewport (p-4 mobile, sm:p-20 desktop)
      const paddingX = vw < 640 ? 32 : 160;
      const availableW = vw - paddingX;
      const availableH = vh * 0.85; 
      
      const imgRatio = nw / nh;
      const containerRatio = availableW / availableH;
      
      let baseWidth, baseHeight;
      if (imgRatio > containerRatio) {
        baseWidth = Math.min(nw, availableW);
        baseHeight = baseWidth / imgRatio;
      } else {
        baseHeight = Math.min(nh, availableH);
        baseWidth = baseHeight * imgRatio;
      }

      if (scale <= 1) {
        setConstraints({ left: 0, right: 0, top: 0, bottom: 0 });
        x.set(0);
        y.set(0);
        onZoomChange?.(false);
        return;
      }

      onZoomChange?.(true);

      const scaledWidth = baseWidth * scale;
      const scaledHeight = baseHeight * scale;

      const xLimit = Math.max(0, (scaledWidth - vw) / 2);
      const yLimit = Math.max(0, (scaledHeight - vh) / 2);

      const newConstraints = {
        left: -xLimit - 20, 
        right: xLimit + 20,
        top: -yLimit - 20,
        bottom: yLimit + 20
      };

      setConstraints(newConstraints);

      // Clamp current position
      const curX = x.get();
      const curY = y.get();
      const nx = Math.min(Math.max(curX, newConstraints.left), newConstraints.right);
      const ny = Math.min(Math.max(curY, newConstraints.top), newConstraints.bottom);
      if (nx !== curX) x.set(nx);
      if (ny !== curY) y.set(ny);
    };

    if (img.complete) {
      runUpdate();
    } else {
      img.onload = runUpdate;
    }
  }, [scale, x, y, onZoomChange, src]);

  useEffect(() => {
    calculateConstraints();
    const timer = setTimeout(calculateConstraints, 150);
    window.addEventListener('resize', calculateConstraints);
    return () => {
      window.removeEventListener('resize', calculateConstraints);
      clearTimeout(timer);
    };
  }, [calculateConstraints]);

  // Handle pinch-to-zoom
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

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scale]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));
  const toggleZoom = () => setScale(scale > 1 ? 1 : 2.5);

  return (
    <div ref={containerRef} className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-20 overflow-hidden">
      {/* Zoom Controls Overlay */}
      <div className="absolute top-6 left-6 flex items-center gap-2 z-[70] bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-2xl">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="w-10 h-10 sm:w-11 sm:h-11 hover:bg-white/10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-20"
        >
          <ZoomOut className="w-5 h-5 sm:w-6 h-6" />
        </button>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 5}
          className="w-10 h-10 sm:w-11 sm:h-11 hover:bg-white/10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-20"
        >
          <ZoomIn className="w-5 h-5 sm:w-6 h-6" />
        </button>
        <button
          onClick={toggleZoom}
          className="w-10 h-10 sm:w-11 sm:h-11 hover:bg-white/10 rounded-xl flex items-center justify-center text-white transition-all"
        >
          <Maximize className="w-5 h-5 sm:w-6 h-6" />
        </button>
      </div>

      <motion.div
        style={{ x, y, scale }}
        drag={scale > 1}
        dragConstraints={constraints}
        dragElastic={0.05}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "relative max-w-full max-h-full flex items-center justify-center",
          scale > 1 ? "cursor-move" : "cursor-default"
        )}
      >
        <img
          ref={imageRef}
          src={src}
          alt=""
          className="max-w-full max-h-[85vh] object-contain select-none shadow-2xl rounded pointer-events-none"
          referrerPolicy="no-referrer"
          onDoubleClick={toggleZoom}
        />
      </motion.div>
    </div>
  );
}

export function FullscreenGallery({
  images,
  initialIndex = 0,
  onClose,
  accentColor = "var(--color-accent-primary)"
}: FullscreenGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const paginate = (newDirection: number) => {
    if (isZoomed) return;
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = images.length - 1;
      if (next >= images.length) next = 0;
      return next;
    });
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden touch-none"
      >
        {/* Top Close Control */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all border border-white/10 z-[110]"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative w-full h-full flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction} mode="wait">
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
              className="absolute inset-0"
            >
              <FullscreenSlide 
                src={images[currentIndex]} 
                onZoomChange={setIsZoomed}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          {images.length > 1 && !isZoomed && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all z-[80] group"
              >
                <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 group-hover:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); paginate(1); }}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all z-[80] group"
              >
                <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Metadata */}
        {!isZoomed && (
          <div className="absolute bottom-0 inset-x-0 p-10 flex flex-col items-center gap-4 bg-gradient-to-t from-black/50 to-transparent z-[80]">
            <div className="flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
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
        )}
      </motion.div>
    </AnimatePresence>
  );
}
