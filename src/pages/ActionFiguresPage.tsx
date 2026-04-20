import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { LoadingScreen, LoadingSpinner } from '../components/Loading';
import { uploadImage } from '../lib/cloudinary';
import { Plus, Edit2, Trash2, Camera, Search, Shield, ChevronDown, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
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
        figureLine: data.figureLine || 'Standard',
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
          <h2 className="text-xl font-medium text-text-main">Action Figures</h2>
          <p className="text-text-muted text-sm mt-1">Manage your curated collection.</p>
        </div>
        <button
          onClick={() => { setEditingFigure(null); setImagePreviews([]); reset(); setIsModalOpen(true); }}
          className="btn-primary-sophisticated h-10 px-6 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Figure</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {figures.map((figure) => (
            <motion.div
              layout
              key={figure.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-card border border-border-subtle rounded-3xl overflow-hidden flex flex-col h-full group hover:shadow-xl hover:shadow-accent-primary/5 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Image Header Style */}
              <div 
                className="relative aspect-video overflow-hidden bg-bg-surface border-b border-border-subtle cursor-pointer"
                onClick={() => {
                  setSelectedGalleryImages(figure.imageUrls || []);
                  setCurrentGalleryIndex(0);
                }}
              >
                {figure.imageUrls?.[0] ? (
                  <img 
                    src={figure.imageUrls[0]} 
                    alt={figure.characterName} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-bg-card/30">
                    <Camera className="w-8 h-8 text-text-muted/30" />
                  </div>
                )}

                {figure.isGifted && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-accent-soft/90 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/20 flex items-center gap-1.5 animate-pulse">
                    <Bookmark className="w-3 h-3 fill-white" />
                    Gift
                  </div>
                )}
                
                {figure.imageUrls && figure.imageUrls.length > 1 && (
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-white text-[9px] font-black uppercase tracking-widest shadow-xl border border-white/10">
                    +{figure.imageUrls.length - 1} IMGS
                  </div>
                )}
              </div>

              {/* Content Layout (Based on First Design) */}
              <div className="p-5 flex flex-col flex-1 gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-main truncate text-lg uppercase tracking-tight" title={figure.characterName}>
                      {figure.characterName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-text-muted mt-0.5">
                      <p className="text-xs font-medium truncate italic">{figure.sourceAnime}</p>
                      {figure.scale && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                          <span className="text-[10px] font-bold text-accent-soft">{figure.scale}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(figure)}
                      className="p-1.5 hover:bg-bg-surface rounded-lg transition-all text-text-muted hover:text-accent-primary active:scale-90"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(figure.id)}
                      className="p-1.5 hover:bg-bg-surface rounded-lg transition-all text-text-muted hover:text-red-500 active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-bg-surface/50 rounded-xl p-3 border border-border-subtle/50 group-hover:border-accent-primary/20 transition-colors">
                    <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">Manufacturer / Line</span>
                    <p className="text-sm font-bold text-text-main truncate">
                      {figure.maker} <span className="text-accent-soft ml-1">{figure.figureLine && `• ${figure.figureLine}`}</span>
                    </p>
                  </div>

                  <div className="flex justify-between items-end py-1">
                    <div>
                      <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-text-muted mb-0.5">Price</span>
                      <span className="text-2xl font-black text-accent-primary tracking-tighter leading-none">
                        {formatCurrency(figure.totalPrice).split('.')[0]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-text-muted mb-0.5">Delivery</span>
                      <span className="text-xs font-bold text-text-main tracking-wide">
                        {figure.shippingCost > 0 ? formatCurrency(figure.shippingCost) : 'FREE'}
                      </span>
                    </div>
                  </div>
                </div>
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

      {/* Gallery Modal */}
      <Modal
        isOpen={!!selectedGalleryImages}
        onClose={() => setSelectedGalleryImages(null)}
        title="Image Gallery"
        className="md:max-w-3xl"
      >
        <div className="relative group min-h-[400px] flex flex-col gap-6">
          <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden bg-bg-surface border border-border-subtle">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentGalleryIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                src={selectedGalleryImages?.[currentGalleryIndex]}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {selectedGalleryImages && selectedGalleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentGalleryIndex(prev => (prev === 0 ? selectedGalleryImages.length - 1 : prev - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-bg-surface/90 backdrop-blur-md rounded-full flex items-center justify-center text-text-main shadow-xl border border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronDown className="w-5 h-5 rotate-90" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentGalleryIndex(prev => (prev === selectedGalleryImages.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-bg-surface/90 backdrop-blur-md rounded-full flex items-center justify-center text-text-main shadow-xl border border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronDown className="w-5 h-5 -rotate-90" />
                </button>
              </>
            )}
          </div>

          <div className="flex justify-center gap-3">
            {selectedGalleryImages?.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentGalleryIndex(idx)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  idx === currentGalleryIndex ? "bg-accent-primary w-8" : "bg-text-muted/30 hover:bg-text-muted/50"
                )}
              />
            ))}
          </div>
        </div>
      </Modal>

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
