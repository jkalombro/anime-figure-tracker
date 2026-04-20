import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/Loading';
import { uploadImage } from '../lib/cloudinary';
import { Plus, Edit2, Trash2, Camera, Calendar, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';

interface PreorderForm {
  figureName: string;
  description: string;
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
        description: data.description || '',
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
      description: preorder.description,
      seller: preorder.seller,
      datePreordered: preorder.datePreordered,
      estimatedArrival: preorder.estimatedArrival,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-xl font-medium text-text-main">Preorders</h2>
          <p className="text-text-muted text-sm mt-1">Status of your incoming grails.</p>
        </div>
        <button
          onClick={() => { setEditingPreorder(null); setImagePreviews([]); reset(); setIsModalOpen(true); }}
          className="btn-primary-sophisticated h-10 px-6 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Preorder</span>
        </button>
      </div>

      <div className="surface-container">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-4 px-4 text-[12px] uppercase tracking-wider text-text-muted font-semibold">Figure & Seller</th>
                <th className="text-left py-4 px-4 text-[12px] uppercase tracking-wider text-text-muted font-semibold">Arrival</th>
                <th className="text-left py-4 px-4 text-[12px] uppercase tracking-wider text-text-muted font-semibold hidden sm:table-cell">Ordered</th>
                <th className="text-right py-4 px-4 text-[12px] uppercase tracking-wider text-text-muted font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {preorders.map((preorder) => (
                  <motion.tr
                    layout
                    key={preorder.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {preorder.imageUrls?.[0] && (
                          <img src={preorder.imageUrls[0]} alt="" className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        )}
                        <div>
                          <span className="block font-semibold text-text-main">{preorder.figureName}</span>
                          <span className="text-xs text-text-muted">{preorder.seller}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-0.5 bg-accent-soft/10 text-accent-soft rounded-md text-[11px] font-medium">
                        {preorder.estimatedArrival}
                      </span>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Calendar className="w-3 h-3" />
                        {preorder.datePreordered}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-3 text-text-muted text-xs font-semibold">
                        <button onClick={() => handleEdit(preorder)} className="hover:text-accent-soft transition-colors px-2">Edit</button>
                        <button onClick={() => handleDelete(preorder.id)} className="hover:text-red-400 transition-colors px-2">Delete</button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {preorders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-text-muted italic opacity-50">
                    No preorders currently in the pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Intel / Notes</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full bg-bg-surface border border-border-subtle rounded-xl p-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none text-sm resize-none transition-all"
                  placeholder="Additional details..."
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
