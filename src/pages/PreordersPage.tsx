import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/Loading';
import { uploadImage } from '../lib/cloudinary';
import { Plus, Edit2, Trash2, Camera, Calendar, ChevronDown, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PreorderForm {
  figureName: string;
  seller: string;
  datePreordered: string;
  estimatedArrivalFrom: string;
  estimatedArrivalTo: string;
  preorderPrice: number | null;
  downpayment: number | null;
  images?: FileList;
}

export function PreordersPage() {
  const { user } = useAuth();
  const [preorders, setPreorders] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreorder, setEditingPreorder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [imageItems, setImageItems] = useState<{ url: string; file?: File }[]>([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[] | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [galleryDirection, setGalleryDirection] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [preorderToDelete, setPreorderToDelete] = useState<any>(null);

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
    const q = query(collection(db, 'preorders'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setPreorders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setInitialLoading(false);
    });
  }, [user]);

  const { register, handleSubmit, reset, watch, formState: { isValid } } = useForm<PreorderForm>({
    mode: 'onChange'
  });
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

  const onSubmit = async (data: PreorderForm) => {
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

      const preorderData = {
        userId: user.uid,
        figureName: data.figureName,
        seller: data.seller,
        datePreordered: data.datePreordered,
        estimatedArrivalFrom: data.estimatedArrivalFrom,
        estimatedArrivalTo: data.estimatedArrivalTo || null,
        preorderPrice: data.preorderPrice !== null ? Number(data.preorderPrice) : 0,
        downpayment: data.downpayment !== null ? Number(data.downpayment) : 0,
        imageUrls: finalImageUrls,
        createdAt: editingPreorder ? editingPreorder.createdAt : serverTimestamp(),
      };

      if (editingPreorder) {
        await updateDoc(doc(db, 'preorders', editingPreorder.id), preorderData);
      } else {
        await addDoc(collection(db, 'preorders'), preorderData);
      }

      setIsModalOpen(false);
      setEditingPreorder(null);
      setImageItems([]);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (preorder: any) => {
    setPreorderToDelete(preorder);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!preorderToDelete) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'preorders', preorderToDelete.id));
      setIsDeleteModalOpen(false);
      setPreorderToDelete(null);
    } catch (error) {
      console.error("Error deleting preorder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (preorder: any) => {
    setEditingPreorder(preorder);
    setImageItems(preorder.imageUrls?.map((url: string) => ({ url })) || []);
    setIsModalOpen(true);
    reset({
      figureName: preorder.figureName,
      seller: preorder.seller,
      datePreordered: preorder.datePreordered,
      estimatedArrivalFrom: preorder.estimatedArrivalFrom || preorder.estimatedArrival || '',
      estimatedArrivalTo: preorder.estimatedArrivalTo || '',
      preorderPrice: preorder.preorderPrice ?? null,
      downpayment: preorder.downpayment ?? null,
    });
  };

  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      // Input is YYYY-MM-DD
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return dateStr;
      
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatMonthYear = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return monthStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex sticky top-0 md:relative z-30 bg-bg-deep/80 backdrop-blur-md md:bg-transparent py-4 md:py-0 justify-between items-end mb-8 transition-all">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-text-main uppercase tracking-tighter italic">Preorders</h2>
          <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Pipeline Track</p>
        </div>
        <button
          onClick={() => { setEditingPreorder(null); setImageItems([]); reset({ figureName: '', seller: '', datePreordered: '', estimatedArrivalFrom: '', estimatedArrivalTo: '', preorderPrice: null, downpayment: null }); setIsModalOpen(true); }}
          className="btn-primary-sophisticated h-10 px-4 sm:px-6 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Preorder</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="space-y-4">
        {initialLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
            <LoadingSpinner variant="brand" />
            <p className="text-xs font-black uppercase tracking-widest italic animate-pulse">Scanning Future Cargo...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {preorders.map((preorder) => (
            <motion.div
              layout
              key={preorder.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-sophisticated p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-y-0.5 sm:gap-x-8 items-baseline">
                  <div className="order-1">
                    <h3 className="font-bold text-text-main truncate text-base tracking-tight">
                      {preorder.figureName}
                    </h3>
                    <p className="text-sm text-text-muted italic truncate leading-tight">
                      {preorder.seller}
                    </p>
                  </div>
                  
                  <div className="order-2 sm:order-2 flex flex-col mt-1 sm:mt-0">
                    <span className="text-[10px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide whitespace-nowrap">
                      Ordered: <span className="text-text-main">{formatDateLong(preorder.datePreordered)}</span>
                    </span>
                    <span className="text-[10px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide whitespace-nowrap">
                      Arrival: <span className="text-text-main">
                        {preorder.estimatedArrivalFrom ? (
                          <>
                            {formatMonthYear(preorder.estimatedArrivalFrom)}
                            {preorder.estimatedArrivalTo && ` — ${formatMonthYear(preorder.estimatedArrivalTo)}`}
                          </>
                        ) : preorder.estimatedArrival}
                      </span>
                    </span>
                  </div>

                  <div className="order-3 sm:order-3 mt-1 sm:mt-2 flex flex-col">
                    <div className="flex gap-4 sm:gap-6">
                      <span className="text-[10px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide">
                        Price: <span className="text-text-main">{formatCurrency(preorder.preorderPrice || 0)}</span>
                      </span>
                      <span className="text-[10px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide">
                        DP: <span className="text-text-main">{formatCurrency(preorder.downpayment || 0)}</span>
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-text-muted font-black uppercase tracking-[0.2em] mt-0.5">
                      Balance: <span className="text-accent-soft">
                        {formatCurrency((preorder.preorderPrice || 0) - (preorder.downpayment || 0))}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 shrink-0 sm:border-l border-border-subtle/50 self-stretch justify-center">
                <button
                  onClick={() => {
                    if (preorder.imageUrls?.length > 0) {
                      setSelectedGalleryImages(preorder.imageUrls);
                      setCurrentGalleryIndex(0);
                    }
                  }}
                  disabled={!preorder.imageUrls || preorder.imageUrls.length === 0}
                  className="p-1.5 text-text-muted hover:text-accent-primary transition-colors disabled:opacity-10 disabled:cursor-not-allowed"
                  title="View Gallery"
                >
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => handleEdit(preorder)}
                  className="p-1.5 text-text-muted hover:text-accent-soft transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => handleDelete(preorder)}
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

      {!initialLoading && preorders.length === 0 && (
        <div className="py-20 text-center text-text-muted italic opacity-50 surface-container">
          No preorders currently in the pipeline.
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
        title={editingPreorder ? "Update Pipeline" : "Log New Preorder"}
        className="md:max-w-xl"
        disabled={loading}
        footer={
          <button
            disabled={loading || !isValid}
            form="preorder-form"
            type="submit"
            className="w-full h-14 bg-accent-primary text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner variant="white" /> : (editingPreorder ? 'Update Pipeline' : 'Lock in Preorder')}
          </button>
        }
      >
        <form id="preorder-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Target Item</label>
        <input
          {...register('figureName', { required: true })}
          autoComplete="off"
          className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
          placeholder="Figure Name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
           <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Provider</label>
           <input
             {...register('seller', { required: true })}
             autoComplete="off"
             className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
             placeholder="Shop Name"
           />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Ordered On</label>
          <input
            type="date"
            {...register('datePreordered', { required: true })}
            className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Preorder Price</label>
          <input
            type="number" step="0.01"
            {...register('preorderPrice', { required: true })}
            autoComplete="off"
            className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all font-bold"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Downpayment</label>
          <input
            type="number" step="0.01"
            {...register('downpayment', { required: true })}
            autoComplete="off"
            className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all font-bold"
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Arrival (From)</label>
          <input
            type="month"
            {...register('estimatedArrivalFrom', { required: true })}
            className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Arrival (To) — Optional</label>
          <input
            type="month"
            {...register('estimatedArrivalTo', {
              validate: (value, formValues) => {
                if (!value) return true;
                return value > formValues.estimatedArrivalFrom || 'Must be at least 1 month ahead';
              }
            })}
            className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
          />
        </div>
      </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">References (up to 3)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {imageItems.map((item, i) => (
                    <div key={i} className="aspect-square rounded-lg border border-border-subtle bg-bg-surface relative group overflow-hidden">
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
                    <div className="aspect-square rounded-lg border-2 border-dashed border-border-subtle flex items-center justify-center text-text-muted relative hover:border-accent-primary transition-colors bg-bg-surface">
                      <Plus className="w-4 h-4" />
                      <input
                        type="file" multiple
                        {...register('images')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                      />
                    </div>
                  )}
                </div>
              </div>
          </fieldset>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !loading && setIsDeleteModalOpen(false)}
        title="Cancel Protocol"
        className="md:max-w-md"
        disabled={loading}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={loading}
              className="flex-1 h-12 rounded-xl text-text-muted font-bold text-xs uppercase tracking-widest hover:bg-bg-card transition-all disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={confirmDelete}
              disabled={loading}
              className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner variant="white" /> : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-text-main italic tracking-tighter">DATA PURGE REQUESTED</h3>
          <p className="text-text-muted text-sm leading-relaxed">
            Are you sure you want to cancel and remove <span className="text-text-main font-bold">"{preorderToDelete?.figureName}"</span> from the pipeline? This history will be lost.
          </p>
        </div>
      </Modal>
    </div>
  );
}
