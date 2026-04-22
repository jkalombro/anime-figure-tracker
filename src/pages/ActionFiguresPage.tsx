import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { LoadingScreen, LoadingSpinner } from '../components/Loading';
import { uploadImage } from '../lib/cloudinary';
import { Plus, Edit2, Trash2, Camera, Search, Shield, ChevronDown, ChevronLeft, ChevronRight, Gift, Image as ImageIcon, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FigureForm {
  characterName: string;
  maker: string;
  figureLine: string;
  scale?: string;
  totalPrice: number;
  shippingCost?: number;
  sourceAnime: string;
  seasonArc?: string;
  images?: FileList;
  isGifted: boolean;
}

export function ActionFiguresPage() {
  const { user } = useAuth();
  const [figures, setFigures] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFigure, setEditingFigure] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [makersSuggestions, setMakersSuggestions] = useState<string[]>([]);
  const [animeSuggestions, setAnimeSuggestions] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
    if (!user) return;
    const q = query(collection(db, 'actionFigures'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setFigures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const makersSnap = await getDocs(collection(db, 'makers'));
      const animeSnap = await getDocs(collection(db, 'anime'));
      setMakersSuggestions(makersSnap.docs.map(doc => doc.data().name));
      setAnimeSuggestions(animeSnap.docs.map(doc => doc.data().title));
    };
    fetchSuggestions();
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { isValid } } = useForm<FigureForm>({
    mode: 'onChange'
  });
  const watchedMaker = watch('maker');
  const watchedAnime = watch('sourceAnime');
  const watchedImages = watch('images');

  useEffect(() => {
    if (watchedImages && watchedImages.length > 0) {
      const urls = Array.from(watchedImages).map(file => URL.createObjectURL(file));
      setImagePreviews(urls);
      return () => urls.forEach(url => URL.revokeObjectURL(url));
    } else if (editingFigure?.imageUrls) {
      setImagePreviews(editingFigure.imageUrls);
    } else {
      setImagePreviews([]);
    }
  }, [watchedImages, editingFigure]);

  const onSubmit = async (data: FigureForm) => {
    if (!user) return;
    setLoading(true);
    try {
      let imageUrls = editingFigure?.imageUrls || [];
      if (data.images && data.images.length > 0) {
        const uploadPromises = Array.from(data.images).map(file => uploadImage(file));
        const newUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newUrls].slice(0, 3);
      }

      const figureData = {
        userId: user.uid,
        characterName: data.characterName,
        maker: data.maker.trim(),
        figureLine: data.figureLine || '',
        scale: data.scale || null,
        totalPrice: Number(data.totalPrice),
        shippingCost: Number(data.shippingCost) || 0,
        sourceAnime: data.sourceAnime.trim(),
        isGifted: data.isGifted,
        imageUrls,
        createdAt: editingFigure ? editingFigure.createdAt : serverTimestamp(),
      };

      if (editingFigure) {
        await updateDoc(doc(db, 'actionFigures', editingFigure.id), figureData);
      } else {
        await addDoc(collection(db, 'actionFigures'), figureData);
        if (!makersSuggestions.includes(figureData.maker)) {
          await addDoc(collection(db, 'makers'), { name: figureData.maker, addedBy: user.uid });
        }
        if (!animeSuggestions.includes(figureData.sourceAnime)) {
          await addDoc(collection(db, 'anime'), { title: figureData.sourceAnime, addedBy: user.uid });
        }
      }

      setIsModalOpen(false);
      setEditingFigure(null);
      setImagePreviews([]);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this figure?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'actionFigures', id));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (figure: any) => {
    setEditingFigure(figure);
    setImagePreviews(figure.imageUrls || []);
    setIsModalOpen(true);
    reset({
      characterName: figure.characterName,
      maker: figure.maker,
      figureLine: figure.figureLine || '',
      scale: figure.scale || '',
      totalPrice: figure.totalPrice,
      shippingCost: figure.shippingCost,
      sourceAnime: figure.sourceAnime,
      isGifted: figure.isGifted || false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-lg font-black text-text-main uppercase tracking-tighter italic">Action Figures</h2>
          <p className="text-text-muted text-[10px] mt-1 uppercase tracking-widest font-bold">Catalog Archive</p>
        </div>
        <button
          onClick={() => { setEditingFigure(null); setImagePreviews([]); reset(); setIsModalOpen(true); }}
          className="btn-primary-sophisticated h-10 px-4 sm:px-6 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New Figure</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {figures.map((figure) => (
            <motion.div
              layout
              key={figure.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-sophisticated flex items-center justify-between gap-4 py-5"
            >
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 items-baseline">
                  <div className="flex items-center gap-2 truncate">
                    {figure.isGifted && (
                      <Gift className="w-3.5 h-3.5 text-accent-soft shrink-0 animate-pulse" />
                    )}
                    <h3 className="font-bold text-text-main truncate text-base tracking-tight" title={figure.characterName}>
                      {figure.characterName}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                    <span className="text-text-main">{figure.maker}</span>
                    <span className="text-accent-soft inline-flex items-center gap-1.5 font-bold">
                      {figure.figureLine && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-text-muted/40 font-normal">•</span>
                          {figure.figureLine}
                        </span>
                      )}
                      {figure.scale && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-text-muted/40 font-normal">•</span>
                          {figure.scale}
                        </span>
                      )}
                    </span>
                  </div>

                  <p className="text-sm text-text-muted italic truncate mt-1">
                    {figure.sourceAnime}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-1 w-full max-w-[300px]">
                    <span className="text-xs text-text-muted font-semibold uppercase tracking-wide whitespace-nowrap">
                      Price: <span className="text-text-main">{formatCurrency(figure.totalPrice)}</span>
                    </span>
                    <span className="text-xs text-text-muted font-semibold uppercase tracking-wide whitespace-nowrap">
                      Delivery: <span className="text-text-main">{figure.shippingCost > 0 ? formatCurrency(figure.shippingCost) : 'FREE'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 sm:gap-2 px-1 sm:px-4 shrink-0 sm:border-l border-border-subtle/50 self-stretch justify-center">
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
                  onClick={() => handleDelete(figure.id)}
                  className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {figures.length === 0 && (
        <div className="py-32 text-center text-text-muted italic opacity-50 surface-container">
          Your collection catalog is empty. Start by recording your first grail.
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
        footer={
          <motion.button
            whileHover={{ scale: isValid ? 1.01 : 1 }}
            whileTap={{ scale: isValid ? 0.99 : 1 }}
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
          <div className="space-y-6">
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
                {watchedAnime && animeSuggestions.filter(a => a.toLowerCase().includes(watchedAnime.toLowerCase()) && a !== watchedAnime).length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl bg-opacity-95">
                    {animeSuggestions.filter(a => a.toLowerCase().includes(watchedAnime.toLowerCase())).slice(0, 5).map(a => (
                      <button key={a} type="button" onClick={() => setValue('sourceAnime', a)} className="w-full text-left px-4 py-3 hover:bg-accent-primary hover:text-white text-sm font-bold transition-colors">{a}</button>
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
                  {watchedMaker && makersSuggestions.filter(m => m.toLowerCase().includes(watchedMaker.toLowerCase()) && m !== watchedMaker).length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl bg-opacity-95">
                      {makersSuggestions.filter(m => m.toLowerCase().includes(watchedMaker.toLowerCase())).slice(0, 5).map(m => (
                        <button key={m} type="button" onClick={() => setValue('maker', m)} className="w-full text-left px-4 py-3 hover:bg-accent-primary hover:text-white text-sm font-bold transition-colors">{m}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Line */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Series/Line (optional)</label>
                <input
                  {...register('figureLine')}
                  autoComplete="off"
                  className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                  placeholder="e.g. Grandista"
                />
              </div>
            </div>

            {/* Scale and isGifted Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Scale (optional)</label>
                <input
                  {...register('scale')}
                  autoComplete="off"
                  className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
                  placeholder="e.g. 1/7"
                />
              </div>
              <div className="flex items-center gap-3 h-11 px-4 bg-bg-surface border border-border-subtle rounded-xl md:mt-6">
                <input
                  type="checkbox"
                  id="isGifted"
                  {...register('isGifted')}
                  className="w-5 h-5 rounded border-border-subtle text-accent-primary focus:ring-accent-primary bg-bg-card"
                />
                <label htmlFor="isGifted" className="text-sm font-bold text-text-main cursor-pointer select-none">Mark as Gift</label>
              </div>
            </div>

            {/* Price and Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Price</label>
                <input
                  type="number" step="0.01"
                  {...register('totalPrice', { required: true })}
                  autoComplete="off"
                  className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Delivery Fee (Optional)</label>
                <input
                  type="number" step="0.01"
                  {...register('shippingCost')}
                  autoComplete="off"
                  className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Images (up to 3)</label>
              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border-subtle bg-bg-surface relative group">
                    <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
                {imagePreviews.length < 3 && (
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
          </div>
        </form>
      </Modal>

      {loading && <div className="fixed inset-0 z-[110] bg-bg-deep/40 backdrop-blur-md"><LoadingScreen /></div>}
    </div>
  );
}
