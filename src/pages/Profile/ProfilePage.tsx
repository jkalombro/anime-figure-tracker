import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, documentId } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import { LoadingScreen } from '../../shared/components/Loading';
import { Box, Package, User as UserIcon, Camera, Home, Users, LogIn, LayoutDashboard, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../../shared/utils/utils';
import { useAuth } from '../../shared/context/AuthContext';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [figures, setFigures] = useState<any[]>([]);
  const [showcases, setShowcases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[] | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [galleryDirection, setGalleryDirection] = useState(0);

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

  const paginate = (newDirection: number) => {
    if (!selectedGalleryImages) return;
    setGalleryDirection(newDirection);
    setCurrentGalleryIndex(prev => {
      let next = prev + newDirection;
      if (next < 0) next = selectedGalleryImages.length - 1;
      if (next >= selectedGalleryImages.length) next = 0;
      return next;
    });
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setProfile(profileData);
          
          // Only fetch specific featured ones if defined
          if (profileData.featuredFigureIds && profileData.featuredFigureIds.length > 0) {
            const figuresQuery = query(
              collection(db, 'actionFigures'),
              where(documentId(), 'in', profileData.featuredFigureIds)
            );
            const figuresSnap = await getDocs(figuresQuery);
            setFigures(figuresSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          } else {
            const figuresQuery = query(
              collection(db, 'actionFigures'), 
              where('userId', '==', userId),
              orderBy('createdAt', 'desc')
            );
            const figuresSnap = await getDocs(figuresQuery);
            setFigures(figuresSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }

          const showcasesQuery = query(
            collection(db, 'showcases'),
            where('userId', '==', userId),
            orderBy('priority', 'asc')
          );
          const showcasesSnap = await getDocs(showcasesQuery);
          setShowcases(showcasesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  if (loading) return <LoadingScreen />;
  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 bg-bg-deep">
      <motion.h2 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-5xl font-black text-text-main tracking-tighter"
      >
        GALLERY <span className="text-accent-primary">NOT FOUND</span>
      </motion.h2>
      <p className="text-text-muted max-w-xs font-medium uppercase tracking-widest text-xs">This curator hasn't opened their exhibition archive yet.</p>
      {currentUser ? (
        <Link to="/dashboard" className="btn-primary-sophisticated flex items-center gap-2">
          <Home className="w-5 h-5" />
          RETURN TO HOME
        </Link>
      ) : (
        <Link to="/" className="btn-primary-sophisticated flex items-center gap-2">
          <LogIn className="w-5 h-5" />
          SIGN IN
        </Link>
      )}
      <Link to="/publicshowcase" className="text-text-muted hover:text-accent-primary transition-colors font-black text-[10px] uppercase tracking-widest mt-4">
        Explore Community instead
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-deep pb-20 text-text-main">
      <div className="h-48 sm:h-64 bg-bg-surface relative overflow-hidden border-b border-border-subtle">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 0.15 }}
           className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-accent-primary)_0%,_transparent_70%)]"
        />
        <div className="absolute top-6 left-6 flex gap-4">
           {currentUser ? (
             <Link to="/dashboard" className="p-3 glass rounded-2xl text-text-main hover:bg-accent-primary hover:text-white transition-all" title="Go to Dashboard">
                <LayoutDashboard className="w-5 h-5" />
             </Link>
           ) : (
             <Link to="/" className="p-3 glass rounded-2xl text-text-main hover:bg-accent-primary hover:text-white transition-all" title="Sign In">
                <LogIn className="w-5 h-5" />
             </Link>
           )}
        </div>
        <div className="absolute top-6 right-6 flex gap-4">
           <Link to="/publicshowcase" className="p-3 glass rounded-2xl text-text-main hover:bg-accent-primary hover:text-white transition-all" title="Return to Community">
              <Users className="w-5 h-5" />
           </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="relative -mt-16 flex flex-col items-start gap-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-1 glass rounded-[2rem]"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.75rem] overflow-hidden border-4 border-accent-primary shadow-2xl">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-bg-card flex items-center justify-center text-accent-primary">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
            </div>
          </motion.div>
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black tracking-tighter uppercase italic"
            >
              {profile.displayName}
            </motion.h1>
          </div>
        </div>

        <div className="mt-8" />

        {showcases.length > 0 && (
          <section className="mt-32 space-y-16">
            <div className="flex items-center gap-6">
              <h2 className="text-xs font-black uppercase tracking-[0.5em] text-accent-soft text-right shrink-0">SHOWCASES</h2>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-accent-soft/30 to-transparent" />
            </div>

            <div className="space-y-12">
               {showcases.map((showcase, idx) => (
                 <motion.div
                   key={showcase.id}
                   initial={{ opacity: 0, y: 40 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: idx * 0.1, duration: 0.8 }}
                   className="relative h-[500px] md:h-[700px] w-full rounded-[2rem] md:rounded-[3.5rem] overflow-hidden group cursor-pointer border border-border-subtle shadow-2xl"
                   onClick={() => {
                     if (showcase.imageUrls?.length > 0) {
                        setSelectedGalleryImages(showcase.imageUrls);
                        setCurrentGalleryIndex(0);
                     }
                   }}
                 >
                   <div className="absolute inset-0">
                      {(showcase.thumbnailUrl || showcase.imageUrls?.[0]) ? (
                        <img 
                          src={showcase.thumbnailUrl || showcase.imageUrls[0]} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full bg-bg-surface flex items-center justify-center">
                           <Camera className="w-12 h-12 text-text-muted/20" />
                        </div>
                      )}
                      {/* Dramatic Overlays */}
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg-deep via-bg-deep/40 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                   </div>

                   <div className="absolute bottom-0 inset-x-0 p-8 md:p-20 flex flex-col justify-end">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (idx * 0.1) }}
                        className="space-y-4 md:space-y-6"
                      >
                        <h3 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl leading-none">
                          {showcase.name}
                        </h3>
                        <p className="text-white/70 text-sm md:text-lg font-medium max-w-3xl leading-relaxed line-clamp-3 md:line-clamp-none">
                          {showcase.description}
                        </p>
                      </motion.div>

                      {showcase.imageUrls?.length > 1 && (
                         <div className="pt-8 md:pt-12 flex items-center gap-3">
                            {showcase.imageUrls.map((_, i) => (
                               <div 
                                 key={i} 
                                 className={cn(
                                   "h-1 rounded-full transition-all duration-700", 
                                   i === 0 ? "w-12 bg-accent-soft" : "w-3 bg-white/20 group-hover:bg-white/40"
                                 )} 
                               />
                            ))}
                            <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] ml-4 bg-white/5 py-1.5 px-3 rounded-full backdrop-blur-md border border-white/5">
                               +{showcase.imageUrls.length - 1} PERSPECTIVES
                            </span>
                         </div>
                      )}
                   </div>

                   {/* Hover Interaction Indicator */}
                   <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white">
                         <LayoutDashboard className="w-6 h-6" />
                      </div>
                   </div>
                 </motion.div>
               ))}
            </div>
          </section>
        )}

        <section className="mt-24 space-y-12">
          <div className="flex items-center gap-6">
            <h2 className="text-xs font-black uppercase tracking-[0.5em] text-accent-primary">FEATURED ITEMS</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-accent-primary/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
              {figures.map((figure, idx) => (
                <motion.div
                  key={figure.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn("group", figure.imageUrls?.length > 0 && "cursor-pointer")}
                  onClick={() => {
                    if (figure.imageUrls?.length > 0) {
                      setSelectedGalleryImages(figure.imageUrls);
                      setCurrentGalleryIndex(0);
                    } else if (figure.imageUrl) {
                      setSelectedGalleryImages([figure.imageUrl]);
                      setCurrentGalleryIndex(0);
                    }
                  }}
                >
                  <div className="relative overflow-hidden rounded-xl aspect-[3/4] bg-bg-surface border border-border-subtle">
                    {figure.imageUrls?.[0] ? (
                      <>
                        <img 
                          src={figure.imageUrls[0]} 
                          alt={figure.characterName} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                          referrerPolicy="no-referrer"
                        />
                        {figure.imageUrls.length > 1 && (
                          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-white/90 border border-white/10">
                            +{figure.imageUrls.length - 1} PHOTOS
                          </div>
                        )}
                      </>
                    ) : figure.imageUrl ? (
                      <img 
                        src={figure.imageUrl} 
                        alt={figure.characterName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-text-muted/20">
                          <Package className="w-12 h-12" />
                       </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/90 via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute bottom-0 inset-x-0 p-6 space-y-1">
                      <div className="flex items-center gap-2">
                        {figure.scale && (
                           <span className="text-[10px] text-accent-soft font-bold uppercase tracking-wider">{figure.scale}</span>
                        )}
                        <span className="text-[10px] text-text-muted font-medium uppercase tracking-widest">{figure.maker}</span>
                      </div>
                      <h3 className="text-lg font-medium text-text-main">{figure.characterName}</h3>
                      <p className="text-xs text-text-muted italic">{figure.sourceAnime}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {figures.length === 0 && (
          <div className="mt-20 p-20 surface-container text-center space-y-4">
             <Box className="w-12 h-12 text-border-subtle mx-auto" />
             <p className="text-text-muted font-medium text-sm">The exhibition is currently in preparation.</p>
          </div>
        )}
      </div>

      <footer className="mt-40 text-center py-12 border-t border-border-subtle">
        <p className="text-text-muted/30 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
           Showcased on 
           <img 
             src="https://res.cloudinary.com/dydhpzure/image/upload/v1777735809/awectavedp0w33t4q32k.png" 
             alt="" 
             className="w-4 h-4 object-contain opacity-50"
           />
           <span className="text-accent-soft">KuraDex</span>
        </p>
      </footer>

      {/* Showcase Image Viewer */}
      <AnimatePresence>
        {selectedGalleryImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
            <button 
              onClick={() => setSelectedGalleryImages(null)}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-50 border border-white/10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <AnimatePresence initial={false} custom={galleryDirection}>
                <motion.div
                  key={currentGalleryIndex}
                  custom={galleryDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(_, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) * velocity.x;
                    if (swipe < -10000) {
                      paginate(1);
                    } else if (swipe > 10000) {
                      paginate(-1);
                    }
                  }}
                  className="absolute inset-0 flex items-center justify-center p-4 sm:p-20 cursor-grab active:cursor-grabbing"
                >
                  <img
                    src={selectedGalleryImages[currentGalleryIndex]}
                    alt=""
                    className="max-w-full max-h-full object-contain select-none pointer-events-none rounded-lg shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </AnimatePresence>

              {selectedGalleryImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                    className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all z-[210] group"
                  >
                    <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); paginate(1); }}
                    className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all z-[210] group"
                  >
                    <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>

            <div className="absolute bottom-10 flex flex-col items-center gap-4">
              <div className="flex gap-2">
                {selectedGalleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentGalleryIndex(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      idx === currentGalleryIndex ? "w-8 bg-accent-soft" : "w-2 bg-white/20 hover:bg-white/40"
                    )}
                  />
                ))}
              </div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                {currentGalleryIndex + 1} / {selectedGalleryImages.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
