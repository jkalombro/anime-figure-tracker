import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { LoadingScreen, LoadingSpinner } from '../components/Loading';
import { uploadImage } from '../lib/cloudinary';
import { Plus, Edit2, Trash2, Camera, User, Save, Link as LinkIcon, Image as ImageIcon, X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ShowcaseForm {
  name: string;
  description: string;
  images?: FileList;
}

export function ShowcasePage() {
  const { user, updateUserProfile } = useAuth();
  const [showcases, setShowcases] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showcaseToDelete, setShowcaseToDelete] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    setInitialLoading(true);
    const q = query(collection(db, 'showcases'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setShowcases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setInitialLoading(false);
    });
  }, [user]);

  const { register, handleSubmit, reset, watch, formState: { isValid } } = useForm<ShowcaseForm>({
    mode: 'onChange'
  });

  const watchedImages = watch('images');

  useEffect(() => {
    if (watchedImages && watchedImages.length > 0) {
      const urls = Array.from(watchedImages).map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...urls].slice(0, 3));
      return () => urls.forEach(url => URL.revokeObjectURL(url));
    } else if (editingShowcase?.imageUrls) {
      setImagePreviews(editingShowcase.imageUrls);
    } else if (!isModalOpen) {
      setImagePreviews([]);
    }
  }, [watchedImages, editingShowcase, isModalOpen]);

  const onSubmit = async (data: ShowcaseForm) => {
    if (!user) return;
    setLoading(true);
    try {
      let imageUrls = editingShowcase?.imageUrls || [];
      if (data.images && data.images.length > 0) {
        const uploadPromises = Array.from(data.images).map(file => uploadImage(file));
        const newUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newUrls].slice(0, 3);
      }

      const showcaseData: any = {
        userId: user.uid,
        name: data.name,
        description: data.description,
        imageUrls,
        updatedAt: serverTimestamp(),
      };

      if (editingShowcase) {
        await updateDoc(doc(db, 'showcases', editingShowcase.id), showcaseData);
      } else {
        showcaseData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'showcases'), showcaseData);
      }

      setIsModalOpen(false);
      setEditingShowcase(null);
      setImagePreviews([]);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (showcase: any) => {
    setEditingShowcase(showcase);
    setImagePreviews(showcase.imageUrls || []);
    setIsModalOpen(true);
    reset({
      name: showcase.name,
      description: showcase.description,
    });
  };

  const handleDelete = (showcase: any) => {
    setShowcaseToDelete(showcase);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!showcaseToDelete) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'showcases', showcaseToDelete.id));
      setIsDeleteModalOpen(false);
      setShowcaseToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter italic flex items-center gap-3">
             <Sparkles className="w-6 h-6 text-accent-soft" />
             Showcase Center
          </h2>
          <p className="text-text-muted text-xs mt-1 uppercase tracking-widest font-bold">Manage Your Exhibitions</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <a 
            href={`/publicshowcase/${user?.uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none h-11 px-6 flex items-center justify-center gap-2 bg-bg-card border border-border-subtle rounded-xl text-text-muted hover:text-accent-primary transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <LinkIcon className="w-4 h-4" />
            Public View
          </a>
          <button
            onClick={() => {
              if (showcases.length >= 3) {
                 alert("Maximum of 3 showcases reached. Delete an existing one to add more.");
                 return;
              }
              setEditingShowcase(null);
              setImagePreviews([]);
              reset({ name: '', description: '' });
              setIsModalOpen(true);
            }}
            disabled={showcases.length >= 3}
            className="flex-2 sm:flex-none btn-primary-sophisticated h-11 px-8 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Showcase
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        {/* Capacity Indicator - Integrated */}
        <div className="card-sophisticated p-6 bg-gradient-to-r from-accent-primary/5 via-accent-soft/5 to-transparent border-border-subtle max-w-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">Exhibition Capacity</h4>
              <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{initialLoading ? '...' : showcases.length} / 3 slots utilized</p>
            </div>
            <div className="flex-1 max-w-xs space-y-2">
              <div className="h-1.5 w-full bg-bg-deep rounded-full overflow-hidden border border-border-subtle">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(showcases.length / 3) * 100}%` }}
                  className={cn(
                    "h-full transition-all duration-1000",
                    showcases.length >= 3 ? "bg-accent-soft" : "bg-accent-primary"
                  )}
                />
              </div>
              {showcases.length >= 3 && !initialLoading && (
                <p className="text-[8px] font-black text-accent-soft uppercase tracking-widest text-right">Maximum capacity reached</p>
              )}
            </div>
          </div>
        </div>

        {/* Showcases List */}
        <div className="space-y-6">
          {initialLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-text-muted">
              <LoadingSpinner variant="brand" />
              <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Retrieving Showcases...</p>
            </div>
          ) : showcases.length === 0 ? (
            <div className="py-24 text-center surface-container rounded-[2rem] border-dashed border-2 border-border-subtle flex flex-col items-center justify-center gap-6 group hover:border-accent-primary/30 transition-all">
              <div className="w-16 h-16 bg-bg-card rounded-3xl flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-colors">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-text-main uppercase tracking-tight italic">No Exhibitions Found</h4>
                <p className="text-text-muted text-xs font-medium max-w-xs mx-auto">You haven't added any showcases to your dashboard yet. Start by creating a virtual gallery of your collection.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-accent-primary font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all"
              >
                Create your first showcase <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showcases.map((showcase, index) => (
                <motion.div
                  key={showcase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-sophisticated group flex flex-col h-full bg-bg-surface border-border-subtle hover:border-accent-primary/30 transition-all overflow-hidden"
                >
                  <div className="h-48 bg-bg-deep relative overflow-hidden">
                    {showcase.imageUrls?.length > 0 ? (
                       <img 
                         src={showcase.imageUrls[0]} 
                         alt="" 
                         className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" 
                         referrerPolicy="no-referrer"
                       />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted opacity-20">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button
                         onClick={() => handleEdit(showcase)}
                         className="w-10 h-10 bg-bg-surface/80 backdrop-blur-md rounded-xl flex items-center justify-center text-text-muted hover:text-accent-primary transition-all border border-border-subtle"
                       >
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => handleDelete(showcase)}
                         className="w-10 h-10 bg-bg-surface/80 backdrop-blur-md rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 transition-all border border-border-subtle"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-text-main tracking-tight uppercase italic">{showcase.name}</h4>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                         <LinkIcon className="w-3 h-3" />
                         Collection Exhibition
                      </p>
                    </div>
                    <p className="text-xs text-text-muted line-clamp-3 leading-relaxed flex-1">
                      {showcase.description}
                    </p>
                    <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                       <div className="flex -space-x-2">
                          {showcase.imageUrls?.slice(1).map((url: string, i: number) => (
                             <div key={i} className="w-8 h-8 rounded-lg border-2 border-bg-surface overflow-hidden bg-bg-surface shadow-sm">
                                <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                             </div>
                          ))}
                          {showcase.imageUrls?.length > 1 && (
                            <div className="text-[10px] font-black text-text-muted ml-4 flex items-center">
                               +{showcase.imageUrls.length - 1} More
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Showcase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShowcase ? "Update Exhibition" : "New Showcase Archive"}
        className="md:max-w-2xl"
        disabled={loading}
        footer={
          <button
            disabled={loading || !isValid}
            form="showcase-form"
            type="submit"
            className="w-full h-14 bg-accent-primary text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-30"
          >
            {loading ? <LoadingSpinner variant="white" /> : (
              <>
                <Save className="w-4 h-4" />
                {editingShowcase ? 'Sync Changes' : 'Publish Showcase'}
              </>
            )}
          </button>
        }
      >
        <form id="showcase-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Exhibition Name</label>
            <input
              {...register('name', { required: true })}
              className="w-full h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm"
              placeholder="e.g. My Shonen Grails"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Description</label>
            <textarea
              {...register('description', { required: true })}
              rows={4}
              className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-3 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm resize-none"
              placeholder="Tell the community about this collection..."
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Gallery Images (Up to 3)</label>
            <div className="grid grid-cols-3 gap-3">
              {imagePreviews.map((url, i) => (
                <div key={i} className="aspect-video sm:aspect-square rounded-lg overflow-hidden border border-border-subtle bg-bg-surface relative group">
                  <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    type="button"
                    onClick={() => {
                        const newPreviews = [...imagePreviews];
                        newPreviews.splice(i, 1);
                        setImagePreviews(newPreviews);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imagePreviews.length < 3 && (
                <div className="aspect-video sm:aspect-square rounded-lg border-2 border-dashed border-border-subtle flex flex-col items-center justify-center text-text-muted relative hover:border-accent-primary transition-colors bg-bg-surface">
                  <Camera className="w-5 h-5 mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Upload Image</span>
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
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Disposal"
        className="md:max-w-md"
        disabled={loading}
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 h-12 rounded-xl text-text-muted font-bold text-xs uppercase tracking-widest hover:bg-bg-card transition-all"
            >
              Abort
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
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
        <p className="text-text-muted text-sm text-center">Are you sure you want to permanently dispose of this exhibition? This action cannot be reversed.</p>
      </Modal>
    </div>
  );
}
