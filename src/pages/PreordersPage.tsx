import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/Loading';
import { uploadImage } from '../lib/cloudinary';
import { Plus, Edit2, Trash2, Camera, Calendar, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';

interface PreorderForm {
  figureName: string;
  seller: string;
  datePreordered: string;
  estimatedArrival: string;
  images?: FileList;
}

export function PreordersPage() {
  const { user } = useAuth();
  const [preorders, setPreorders] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreorder, setEditingPreorder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[] | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'preorders'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setPreorders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  const { register, handleSubmit, reset, watch, formState: { isValid } } = useForm<PreorderForm>({
    mode: 'onChange'
  });
  const watchedImages = watch('images');

  useEffect(() => {
    if (watchedImages && watchedImages.length > 0) {
      const urls = Array.from(watchedImages).map(file => URL.createObjectURL(file));
      setImagePreviews(urls);
      return () => urls.forEach(url => URL.revokeObjectURL(url));
    } else if (editingPreorder?.imageUrls) {
      setImagePreviews(editingPreorder.imageUrls);
    } else {
      setImagePreviews([]);
    }
  }, [watchedImages, editingPreorder]);

  const onSubmit = async (data: PreorderForm) => {
    if (!user) return;
    setLoading(true);
    try {
      let imageUrls = editingPreorder?.imageUrls || [];
      if (data.images && data.images.length > 0) {
        const uploadPromises = Array.from(data.images).map(file => uploadImage(file));
        const newUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newUrls].slice(0, 3);
      }

      const preorderData = {
        userId: user.uid,
        figureName: data.figureName,
        seller: data.seller,
        datePreordered: data.datePreordered,
        estimatedArrival: data.estimatedArrival,
        imageUrls,
        createdAt: editingPreorder ? editingPreorder.createdAt : serverTimestamp(),
      };

      if (editingPreorder) {
        await updateDoc(doc(db, 'preorders', editingPreorder.id), preorderData);
      } else {
        await addDoc(collection(db, 'preorders'), preorderData);
      }

      setIsModalOpen(false);
      setEditingPreorder(null);
      setImagePreviews([]);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this preorder?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'preorders', id));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (preorder: any) => {
    setEditingPreorder(preorder);
    setImagePreviews(preorder.imageUrls || []);
    setIsModalOpen(true);
    reset({
      figureName: preorder.figureName,
      seller: preorder.seller,
      datePreordered: preorder.datePreordered,
      estimatedArrival: preorder.estimatedArrival,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-lg font-black text-text-main uppercase tracking-tighter italic">Preorders</h2>
          <p className="text-text-muted text-[10px] mt-1 uppercase tracking-widest font-bold">Pipeline Track</p>
        </div>
        <button
          onClick={() => { setEditingPreorder(null); setImagePreviews([]); reset(); setIsModalOpen(true); }}
          className="btn-primary-sophisticated h-10 px-6 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Preorder</span>
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {preorders.map((preorder) => (
            <motion.div
              layout
              key={preorder.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-sophisticated flex items-center justify-between gap-4 py-5"
            >
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 items-baseline">
                  <h3 className="font-bold text-text-main truncate text-base tracking-tight">
                    {preorder.figureName}
                  </h3>
                  <span className="text-xs text-text-muted font-semibold uppercase tracking-wide whitespace-nowrap">
                    Date Ordered: <span className="text-text-main">{preorder.datePreordered}</span>
                  </span>
                  
                  <p className="text-sm text-text-muted italic truncate mt-1">
                    {preorder.seller}
                  </p>
                  <span className="text-xs text-text-muted font-semibold uppercase tracking-wide whitespace-nowrap mt-1">
                    Est Arrival: <span className="text-text-main">{preorder.estimatedArrival}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 px-2 shrink-0 sm:border-l border-border-subtle/50 h-10 self-center">
                <button
                  onClick={() => {
                    if (preorder.imageUrls?.length > 0) {
                      setSelectedGalleryImages(preorder.imageUrls);
                      setCurrentGalleryIndex(0);
                    }
                  }}
                  disabled={!preorder.imageUrls || preorder.imageUrls.length === 0}
                  className="p-2 text-text-muted hover:text-accent-primary transition-colors disabled:opacity-10 disabled:cursor-not-allowed"
                  title="View Gallery"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEdit(preorder)}
                  className="p-2 text-text-muted hover:text-accent-soft transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(preorder.id)}
                  className="p-2 text-text-muted hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {preorders.length === 0 && (
          <div className="py-20 text-center text-text-muted italic opacity-50 surface-container">
            No preorders currently in the pipeline.
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedGalleryImages}
        onClose={() => setSelectedGalleryImages(null)}
        title="Reference Gallery"
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
          
          <div className="flex justify-center gap-2">
            {selectedGalleryImages?.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentGalleryIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentGalleryIndex ? 'bg-accent-primary w-6' : 'bg-text-muted/30'}`}
              />
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPreorder ? "Update Pipeline" : "Log New Preorder"}
        className="md:max-w-xl"
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
          <div className="space-y-4">
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
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Estimated Arrival</label>
                  <input
                    {...register('estimatedArrival', { required: true })}
                    autoComplete="off"
                    className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
                    placeholder="e.g. Q4 2026"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Ordered On</label>
                <input
                  type="date"
                  {...register('datePreordered', { required: true })}
                  className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">References (up to 3)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {imagePreviews.map((url, i) => (
                    <img key={i} src={url} className="aspect-square rounded-lg object-cover border border-border-subtle bg-bg-surface" referrerPolicy="no-referrer" />
                  ))}
                  {imagePreviews.length < 3 && (
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
          </div>
        </form>
      </Modal>
    </div>
  );
}
