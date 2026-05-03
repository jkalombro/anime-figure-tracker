import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { Modal } from '../../shared/components/Modal';
import { LoadingScreen, LoadingSpinner } from '../../shared/components/Loading';
import { uploadImage } from '../../shared/services/cloudinary';
import { Plus, Edit2, Trash2, Camera, Search, Shield, ChevronDown, ChevronLeft, ChevronRight, Gift, Image as ImageIcon, X, ArrowUp, ArrowDown, ShoppingBag, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatCurrency, cn } from '../../shared/utils/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FigureForm {
  characterName: string;
  maker: string;
  figureLine: string;
  totalPrice: number | null;
  sourceAnime: string;
  seasonArc?: string;
  images?: FileList;
  isGifted: boolean;
  description?: string;
}

type FilterType = 'all' | 'purchased' | 'gifted';
type SortField = 'characterName' | 'sourceAnime' | 'maker' | 'totalPrice';
type SortOrder = 'asc' | 'desc';

export function ActionFiguresPage() {
  const { user } = useAuth();
  const [figures, setFigures] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFigure, setEditingFigure] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayFigures, setDisplayFigures] = useState<any[]>([]);

  // Filtering & Sorting State
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalPrice');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [makersSuggestions, setMakersSuggestions] = useState<string[]>([]);
  const [animeSuggestions, setAnimeSuggestions] = useState<string[]>([]);
  const [imageItems, setImageItems] = useState<{ url: string; file?: File }[]>([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[] | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [galleryDirection, setGalleryDirection] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [figureToDelete, setFigureToDelete] = useState<any>(null);

  const purchasedBasePrice = figures.filter(f => !f.isGifted).reduce((sum, f) => sum + (f.totalPrice || 0), 0);
  
  const giftsBasePrice = figures.filter(f => f.isGifted).reduce((sum, f) => sum + (f.totalPrice || 0), 0);

  const totalBasePrice = figures.reduce((sum, f) => sum + (f.totalPrice || 0), 0);

  const totalPurchasedCount = figures.filter(f => !f.isGifted).length;
  const totalGiftsCount = figures.filter(f => f.isGifted).length;
  const totalFiguresCount = figures.length;

  useEffect(() => {
    if (initialLoading) return;
    
    setIsFiltering(true);
    const timer = setTimeout(() => {
      const results = figures
        .filter(figure => {
          if (activeFilter === 'gifted' && !figure.isGifted) return false;
          if (activeFilter === 'purchased' && figure.isGifted) return false;
          
          const searchLower = searchQuery.toLowerCase();
          return (
            figure.characterName.toLowerCase().includes(searchLower) ||
            figure.sourceAnime.toLowerCase().includes(searchLower) ||
            figure.maker.toLowerCase().includes(searchLower) ||
            (figure.figureLine && figure.figureLine.toLowerCase().includes(searchLower))
          );
        })
        .sort((a, b) => {
          let valA = a[sortField] ?? '';
          let valB = b[sortField] ?? '';
          
          if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
          }
          
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      
      setDisplayFigures(results);
      setIsFiltering(false);
    }, 400); // 400ms delay for smooth transition

    return () => clearTimeout(timer);
  }, [figures, activeFilter, searchQuery, sortField, sortOrder, initialLoading]);

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
    if (!user) return;
    setInitialLoading(true);
    const q = query(collection(db, 'actionFigures'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setFigures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setInitialLoading(false);
    });
  }, [user]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isModalOpen) {
        try {
          const makersSnap = await getDocs(collection(db, 'makers'));
          const animeSnap = await getDocs(collection(db, 'anime'));
          
          // Deduplicate suggestions (case-insensitive)
          const uniqueMakers = Array.from(new Set(makersSnap.docs.map(doc => doc.data().name.trim()))).filter(Boolean);
          const uniqueAnime = Array.from(new Set(animeSnap.docs.map(doc => doc.data().title.trim()))).filter(Boolean);
          
          setMakersSuggestions(uniqueMakers);
          setAnimeSuggestions(uniqueAnime);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      }
    };
    fetchSuggestions();
  }, [isModalOpen]);

  const { register, handleSubmit, reset, setValue, watch, formState: { isValid } } = useForm<FigureForm>({
    mode: 'onChange'
  });
  const watchedMaker = watch('maker');
  const watchedAnime = watch('sourceAnime');
  const watchedImages = watch('images');

  useEffect(() => {
    if (watchedImages && watchedImages.length > 0) {
      const newFiles = Array.from(watchedImages);
      const newItems = newFiles.map(file => ({
        url: URL.createObjectURL(file),
        file
      }));
      
      setImageItems(prev => {
        const combined = [...prev, ...newItems].slice(0, 3);
        return combined;
      });
      
      return () => newItems.forEach(item => URL.revokeObjectURL(item.url));
    }
  }, [watchedImages]);

  const onSubmit = async (data: FigureForm) => {
    if (!user) return;
    setLoading(true);
    try {
      const finalImageUrls: string[] = [];
      
      for (const item of imageItems) {
        if (item.file) {
          const uploadedUrl = await uploadImage(item.file);
          finalImageUrls.push(uploadedUrl);
        } else {
          finalImageUrls.push(item.url);
        }
      }

      const figureData: any = {
        userId: user.uid,
        characterName: data.characterName,
        maker: data.maker.trim(),
        figureLine: data.figureLine || '',
        totalPrice: data.totalPrice !== null ? Number(data.totalPrice) : 0,
        sourceAnime: data.sourceAnime.trim(),
        isGifted: data.isGifted,
        description: data.description || '',
        imageUrls: finalImageUrls,
        createdAt: editingFigure ? editingFigure.createdAt : serverTimestamp(),
      };

      if (editingFigure) {
        await updateDoc(doc(db, 'actionFigures', editingFigure.id), figureData);
      } else {
        await addDoc(collection(db, 'actionFigures'), figureData);
      }

      // Sync Intellisense Collections (Case Insensitive)
      const makerExists = makersSuggestions.some(m => m.toLowerCase() === figureData.maker.toLowerCase());
      if (!makerExists && figureData.maker) {
        await addDoc(collection(db, 'makers'), { name: figureData.maker, addedBy: user.uid });
      }
      
      const animeExists = animeSuggestions.some(a => a.toLowerCase() === figureData.sourceAnime.toLowerCase());
      if (!animeExists && figureData.sourceAnime) {
        await addDoc(collection(db, 'anime'), { title: figureData.sourceAnime, addedBy: user.uid });
      }

      setIsModalOpen(false);
      setEditingFigure(null);
      setImageItems([]);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (figure: any) => {
    setFigureToDelete(figure);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!figureToDelete) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'actionFigures', figureToDelete.id));
      setIsDeleteModalOpen(false);
      setFigureToDelete(null);
    } catch (error) {
      console.error("Error deleting figure:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (figure: any) => {
    setEditingFigure(figure);
    setImageItems(figure.imageUrls?.map((url: string) => ({ url })) || []);
    setIsModalOpen(true);
    reset({
      characterName: figure.characterName,
      maker: figure.maker,
      figureLine: figure.figureLine || '',
      totalPrice: figure.totalPrice ?? null,
      sourceAnime: figure.sourceAnime,
      isGifted: figure.isGifted || false,
      description: figure.description || '',
    });
  };

  const abbreviateMaker = (maker: string) => {
    if (!maker) return '';
    const words = maker.trim().split(/\s+/);
    if (words.length > 1) {
      return words.map(word => word[0].toUpperCase()).join('');
    }
    return maker;
  };

  return (
    <div className="space-y-6">
      <div className="flex sticky top-[56px] md:relative z-30 bg-bg-deep/80 backdrop-blur-md md:bg-transparent py-4 md:py-0 justify-between items-end mb-8 transition-all">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-text-main uppercase tracking-tighter italic">Action Figures</h2>
          <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Catalog Archive</p>
        </div>
        <button
          onClick={() => { setEditingFigure(null); setImageItems([]); reset({ characterName: '', maker: '', figureLine: '', totalPrice: null, sourceAnime: '', isGifted: false, description: '' }); setIsModalOpen(true); }}
          className="btn-primary-sophisticated h-10 px-4 sm:px-6 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New Figure</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { 
            id: 'all' as const, 
            label: "Figure Expenses", 
            mobileLabel: "Total",
            value: totalBasePrice, 
            extra: '',
            count: totalFiguresCount, 
            icon: Package, 
            activeColor: "bg-emerald-500/15",
            activeBorder: "border-emerald-500", 
            hoverBorder: "hover:border-accent-primary/50" 
          },
          { 
            id: 'purchased' as const, 
            label: "Total Purchased", 
            mobileLabel: "Purchased",
            value: purchasedBasePrice, 
            extra: '',
            count: totalPurchasedCount, 
            icon: ShoppingBag, 
            activeColor: "bg-emerald-500/15",
            activeBorder: "border-emerald-500", 
            hoverBorder: "hover:border-accent-primary/50" 
          },
          { 
            id: 'gifted' as const, 
            label: "Total Gifts", 
            mobileLabel: "Gifts",
            value: giftsBasePrice, 
            extra: '',
            count: totalGiftsCount, 
            icon: Gift, 
            activeColor: "bg-emerald-500/15",
            activeBorder: "border-emerald-500", 
            hoverBorder: "hover:border-emerald-500/50" 
          }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFilter(item.id)}
            className={cn(
              "card-sophisticated p-2 sm:p-4 transition-all text-left group border-2 h-full flex flex-col justify-between",
              activeFilter === item.id 
                ? `${item.activeColor} ${item.activeBorder} shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02]` 
                : `bg-bg-surface border-transparent ${item.hoverBorder}`
            )}
          >
            <div>
              <div className={cn(
                "text-[7px] sm:text-[9px] uppercase font-black tracking-[0.1em] sm:tracking-[0.2em] flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3",
                activeFilter === item.id ? "text-emerald-600 dark:text-emerald-400" : "text-text-muted"
              )}>
                <div className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all",
                  activeFilter === item.id ? "bg-emerald-500 text-white" : "bg-accent-primary/5 text-accent-primary group-hover:bg-accent-primary group-hover:text-white"
                )}>
                  <item.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="truncate">
                  <span className="sm:hidden">{item.mobileLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1">
                <p className={cn(
                  "text-[10px] sm:text-lg lg:text-xl font-black tracking-tighter truncate",
                  activeFilter === item.id ? "text-text-main" : "text-text-main"
                )}>
                  {formatCurrency(item.value)}
                </p>
                {item.extra && (
                  <span className={cn(
                    "text-[7px] sm:text-[10px] font-bold shrink-0",
                    activeFilter === item.id ? "text-accent-soft" : "text-accent-soft"
                  )}>
                    {item.extra}
                  </span>
                )}
              </div>
            </div>
            
            <p className={cn(
              "text-[7px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider mt-2 opacity-70",
              activeFilter === item.id ? "text-text-muted" : "text-text-muted"
            )}>
              {item.count} item{item.count !== 1 ? 's' : ''}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search characters, series, makers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl pl-11 pr-4 text-sm focus:ring-1 focus:ring-accent-primary outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-deep rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-text-muted" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl px-4 text-sm focus:ring-1 focus:ring-accent-primary outline-none appearance-none cursor-pointer pr-10 font-bold"
            >
              <option value="characterName">Character Name</option>
              <option value="sourceAnime">Source Series</option>
              <option value="maker">Maker</option>
              <option value="totalPrice">Price</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-12 w-12 flex items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl text-text-muted hover:text-accent-primary transition-colors shrink-0"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {initialLoading || isFiltering ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
            <LoadingSpinner variant="brand" />
            <p className="text-xs font-black uppercase tracking-widest italic animate-pulse">
              {initialLoading ? "Sourcing Archives..." : "Refining Catalog..."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayFigures.map((figure) => (
            <motion.div
              layout
              key={figure.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-sophisticated px-4 flex items-center justify-between gap-4 py-5 relative overflow-hidden"
            >
              {figure.isGifted && (
                <div className="absolute top-0 left-0 z-10">
                  <div className="bg-accent-soft/20 dark:bg-accent-soft/30 text-accent-soft px-2 py-2 rounded-br-2xl border-r border-b border-accent-soft/20 flex items-center justify-center">
                    <Gift className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                  {/* First Row */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-bold text-text-main text-base tracking-tight leading-snug">
                      <span>{figure.characterName}</span>
                      <span className="mx-2 text-text-muted/30 font-normal">•</span>
                      <span className="text-text-muted uppercase text-[10px] sm:text-xs font-black tracking-widest" title={figure.maker}>{abbreviateMaker(figure.maker)}</span>
                      {figure.figureLine && (
                        <>
                          <span className="mx-2 text-text-muted/30 font-normal">•</span>
                          <span className="text-accent-soft font-bold text-xs sm:text-sm whitespace-nowrap">
                            {figure.figureLine}
                          </span>
                        </>
                      )}
                    </h3>
                  </div>

                  {/* Second Row - Maintains current content */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 items-baseline mt-1">
                    <p className="text-sm text-text-muted italic truncate mb-2">
                      {figure.sourceAnime}
                    </p>

                    <div className="flex w-full max-w-[300px]">
                      <span className="text-xs text-text-muted font-semibold uppercase tracking-wide whitespace-nowrap">
                        Price: <span className="text-text-main">{formatCurrency(figure.totalPrice)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 shrink-0 sm:border-l border-border-subtle/50 self-stretch justify-center">
                <button
                  onClick={() => {
                    if (figure.imageUrls?.length > 0) {
                      setSelectedGalleryImages(figure.imageUrls);
                      setCurrentGalleryIndex(0);
                    }
                  }}
                  disabled={!figure.imageUrls || figure.imageUrls.length === 0}
                  className="p-1.5 text-text-muted hover:text-accent-primary transition-colors disabled:opacity-10 disabled:cursor-not-allowed"
                  title="View Gallery"
                >
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => handleEdit(figure)}
                  className="p-1.5 text-text-muted hover:text-accent-soft transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => handleDelete(figure)}
                  className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        )}
      </div>

      {!initialLoading && !isFiltering && displayFigures.length === 0 && (
        <div className="py-32 text-center text-text-muted italic opacity-50 surface-container">
          {figures.length === 0 
            ? "Your collection catalog is empty. Start by recording your first grail." 
            : "No figures match your search or filter."
          }
        </div>
      )}

      {/* Custom Fullscreen Gallery */}
      <AnimatePresence>
        {selectedGalleryImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
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
                  onDragEnd={(e, { offset, velocity }) => {
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
                    className="max-w-full max-h-full object-contain select-none pointer-events-none rounded-sm shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </AnimatePresence>

              {selectedGalleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => paginate(-1)}
                    className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all z-[210] group"
                  >
                    <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => paginate(1)}
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
                      idx === currentGalleryIndex ? "w-8 bg-accent-primary" : "w-2 bg-white/20 hover:bg-white/40"
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFigure ? "Update Details" : "Record New Action Figure"}
        className="md:max-w-2xl"
        disabled={loading}
        footer={
          <motion.button
            whileHover={{ scale: (isValid && !loading) ? 1.01 : 1 }}
            whileTap={{ scale: (isValid && !loading) ? 0.99 : 1 }}
            disabled={loading || !isValid}
            form="figure-form"
            type="submit"
            className="w-full h-14 bg-accent-primary text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner variant="white" /> : (
              <>
                <Shield className="w-4 h-4" />
                {editingFigure ? 'Update Details' : 'Save details'}
              </>
            )}
          </motion.button>
        }
      >
        <form id="figure-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <fieldset disabled={loading} className="space-y-6">
            {/* Character Name */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Character Name(s)</label>
              <input
                {...register('characterName', { required: true })}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                placeholder="e.g. Uchiha Itachi"
              />
            </div>

            {/* Source Series */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Source Series</label>
              <div className="relative">
                <input
                  {...register('sourceAnime', { required: true })}
                  autoComplete="off"
                  className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                  placeholder="e.g. Naruto Shippuden"
                />
                {watchedAnime && animeSuggestions.filter(a => a.toLowerCase().includes(watchedAnime.toLowerCase()) && a.toLowerCase() !== watchedAnime.toLowerCase()).length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl bg-opacity-95">
                    {animeSuggestions.filter(a => a.toLowerCase().includes(watchedAnime.toLowerCase())).slice(0, 5).map((a, i) => (
                      <button key={`${a}-${i}`} type="button" onClick={() => setValue('sourceAnime', a)} className="w-full text-left px-4 py-3 hover:bg-accent-primary hover:text-white text-sm font-bold transition-colors">{a}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Maker and Line Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Maker */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Maker</label>
                <div className="relative">
                  <input
                    {...register('maker', { required: true })}
                    autoComplete="off"
                    className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                    placeholder="e.g. Banpresto"
                  />
                  {watchedMaker && makersSuggestions.filter(m => m.toLowerCase().includes(watchedMaker.toLowerCase()) && m.toLowerCase() !== watchedMaker.toLowerCase()).length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl bg-opacity-95">
                      {makersSuggestions.filter(m => m.toLowerCase().includes(watchedMaker.toLowerCase())).slice(0, 5).map((m, i) => (
                        <button key={`${m}-${i}`} type="button" onClick={() => setValue('maker', m)} className="w-full text-left px-4 py-3 hover:bg-accent-primary hover:text-white text-sm font-bold transition-colors">{m}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Line */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Series/Line/Scale (optional)</label>
                <input
                  {...register('figureLine')}
                  autoComplete="off"
                  className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                  placeholder="e.g. 20th anniversary series"
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Price</label>
              <input
                type="number" step="0.01"
                {...register('totalPrice', { required: true })}
                autoComplete="off"
                className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Images (up to 3)</label>
              <div className="grid grid-cols-3 gap-3">
                {imageItems.map((item, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border-subtle bg-bg-surface relative group">
                    <img src={item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      type="button"
                      onClick={() => {
                        setImageItems(prev => prev.filter((_, idx) => idx !== i));
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {imageItems.length < 3 && (
                  <div className="aspect-square rounded-lg border-2 border-dashed border-border-subtle flex flex-col items-center justify-center text-text-muted relative hover:border-accent-primary transition-colors bg-bg-surface">
                    <Plus className="w-5 h-5" />
                    <input
                      type="file"
                      multiple
                      {...register('images')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Additional Details (optional)</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-3 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm resize-none"
                placeholder="e.g. Put the extra details of your figure here like the height, special value, etc"
              />
            </div>

            {/* Gift Checkbox */}
            <div className="flex items-start sm:items-center gap-3 px-1">
              <input
                type="checkbox"
                id="isGifted"
                {...register('isGifted')}
                className="w-5 h-5 mt-0.5 sm:mt-0 rounded border-border-subtle text-accent-primary focus:ring-accent-primary bg-bg-card shrink-0"
              />
              <label htmlFor="isGifted" className="text-sm font-bold text-text-main cursor-pointer select-none leading-tight">
                Mark as Gift 
                <span className="block sm:inline sm:ml-2 text-[10px] text-text-muted font-medium normal-case tracking-normal">
                  Check this if this figure was gifted to you by someone
                </span>
              </label>
            </div>
          </fieldset>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !loading && setIsDeleteModalOpen(false)}
        title="Confirm Disposal"
        className="md:max-w-md"
        disabled={loading}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={loading}
              className="flex-1 h-12 rounded-xl text-text-muted font-bold text-xs uppercase tracking-widest hover:bg-bg-card transition-all disabled:opacity-30"
            >
              Abort
            </button>
            <button
              onClick={confirmDelete}
              disabled={loading}
              className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner variant="white" /> : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Dispose
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-text-main italic tracking-tighter">INITIATING DATA DISPOSAL</h3>
          <p className="text-text-muted text-sm leading-relaxed">
            Are you sure you want to remove <span className="text-text-main font-bold">"{figureToDelete?.characterName}"</span> from the catalog archive? This action cannot be reversed.
          </p>
        </div>
      </Modal>

      {/* removed loading screen overlay */}
    </div>
  );
}
