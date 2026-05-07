import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { Modal } from '../../shared/components/Modal';
import { LoadingSpinner } from '../../shared/components/Loading';
import { uploadImage } from '../../shared/services/cloudinary';
import { AddItemButton } from '../../shared/components/AddItemButton.tsx';
import { FullscreenGallery } from '../../shared/components/FullscreenGallery';
import { Plus, Edit2, Trash2, Camera, Calendar, ChevronDown, ChevronLeft, ChevronRight, X, Image as ImageIcon, Box, ZoomIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatCurrency, cn } from '../../shared/utils/utils';
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [preorderToDelete, setPreorderToDelete] = useState<any>(null);
  const [isReceivedModalOpen, setIsReceivedModalOpen] = useState(false);
  const [preorderToMark, setPreorderToMark] = useState<any>(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user) return;
    setInitialLoading(true);
    const q = query(collection(db, 'preorders'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      const sorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aReceived = !!a.receivedAt;
          const bReceived = !!b.receivedAt;
          if (aReceived !== bReceived) return aReceived ? 1 : -1;
          return (a.estimatedArrivalFrom || '').localeCompare(b.estimatedArrivalFrom || '');
        });
      setPreorders(sorted);
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

  const confirmReceived = async () => {
    if (!preorderToMark) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'preorders', preorderToMark.id), {
        receivedAt: receivedDate,
        updatedAt: serverTimestamp()
      });
      setIsReceivedModalOpen(false);
      setPreorderToMark(null);
    } catch (error) {
      console.error("Error marking as received:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex sticky top-[56px] md:relative z-30 bg-bg-deep/80 backdrop-blur-md md:bg-transparent py-4 md:py-0 justify-between items-end mb-8 transition-all">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-text-main uppercase tracking-tighter italic">Preorders</h2>
          <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Pipeline Track</p>
        </div>
        <AddItemButton 
          onClick={() => { setEditingPreorder(null); setImageItems([]); reset({ figureName: '', seller: '', datePreordered: '', estimatedArrivalFrom: '', estimatedArrivalTo: '', preorderPrice: null, downpayment: null }); setIsModalOpen(true); }}
          label="Add Preorder"
        />
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
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-y-4 sm:gap-x-8 items-start">
                  <div className="order-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-text-main truncate text-base tracking-tight">
                        {preorder.figureName}
                      </h3>
                      {preorder.receivedAt && (
                        <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-wider h-fit">RECEIVED</span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted italic truncate leading-tight">
                      {preorder.seller}
                    </p>
                    {!preorder.receivedAt ? (
                      <button
                        onClick={() => {
                          setPreorderToMark(preorder);
                          setReceivedDate(new Date().toISOString().split('T')[0]);
                          setIsReceivedModalOpen(true);
                        }}
                        className="mt-2 text-[9px] font-black uppercase tracking-widest text-accent-primary hover:text-accent-soft transition-colors flex items-center gap-1.5 w-fit bg-accent-primary/5 px-2 py-1 rounded-lg border border-accent-primary/10 hover:border-accent-primary/30"
                      >
                        Mark as Received
                      </button>
                    ) : (
                      <span className="mt-2 text-[9px] font-black uppercase tracking-widest text-text-muted/50 flex items-center gap-1.5 grayscale">
                        Received on {formatDateLong(preorder.receivedAt)}
                      </span>
                    )}
                  </div>
                  
                  <div className="order-2 flex flex-col gap-2">
                    <div>
                      <span className="text-[10px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide block">
                        Ordered: <span className="text-text-main">{formatDateLong(preorder.datePreordered)}</span>
                      </span>
                      <span className="text-[10px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide block">
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

                    <div className="flex flex-wrap gap-x-4 gap-y-1 items-center border-t border-border-subtle/30 pt-2">
                      <span className="text-[10px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide">
                        Price: <span className="text-text-main">{formatCurrency(preorder.preorderPrice || 0)}</span>
                      </span>
                      <span className="text-[10px] sm:text-xs text-text-muted font-semibold uppercase tracking-wide">
                        DP: <span className="text-text-main">{formatCurrency(preorder.downpayment || 0)}</span>
                      </span>
                      <span className="text-[10px] sm:text-xs text-text-muted font-black uppercase tracking-wide">
                        Balance: <span className="text-accent-soft">
                          {formatCurrency((preorder.preorderPrice || 0) - (preorder.downpayment || 0))}
                        </span>
                      </span>
                    </div>
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
      )}      {/* Custom Fullscreen Gallery */}
      {selectedGalleryImages && (
        <FullscreenGallery 
          images={selectedGalleryImages}
          initialIndex={currentGalleryIndex}
          onClose={() => setSelectedGalleryImages(null)}
          accentColor="var(--color-accent-primary)"
        />
      )}

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

      {/* Mark as Received Modal */}
      <Modal
        isOpen={isReceivedModalOpen}
        onClose={() => !loading && setIsReceivedModalOpen(false)}
        title="Inventory Update"
        className="md:max-w-md"
        disabled={loading}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsReceivedModalOpen(false)}
              disabled={loading}
              className="flex-1 h-12 rounded-xl text-text-muted font-bold text-xs uppercase tracking-widest hover:bg-bg-card transition-all disabled:opacity-30"
            >
              Cancel
            </button>
            <button
              onClick={confirmReceived}
              disabled={loading}
              className="flex-1 h-12 bg-accent-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-accent-soft transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner variant="white" /> : 'Confirm Check-in'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-accent-primary/10 text-accent-primary rounded-2xl flex items-center justify-center mb-4">
              <Box className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-text-main italic tracking-tighter uppercase">Cargo Arrival</h3>
            <p className="text-text-muted text-sm leading-relaxed mt-2">
              Logging <span className="text-text-main font-bold">"{preorderToMark?.figureName}"</span> into the permanent collection.
            </p>
          </div>
          
          <div className="bg-bg-card p-4 rounded-2xl border border-border-subtle">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Date Received</label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full h-12 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all font-bold"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
