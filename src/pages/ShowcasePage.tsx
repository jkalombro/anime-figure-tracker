import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { LoadingScreen, LoadingSpinner } from '../components/Loading';
import { uploadImage } from '../lib/cloudinary';
import { Plus, Edit2, Trash2, Camera, User, Save, Link as LinkIcon, Image as ImageIcon, X, Sparkles, AlertCircle, CheckCircle2, GripVertical, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const [imageItems, setImageItems] = useState<{ url: string; file?: File }[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showcaseToDelete, setShowcaseToDelete] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    setInitialLoading(true);
    const q = query(collection(db, 'showcases'), where('userId', '==', user.uid), orderBy('priority', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setShowcases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setInitialLoading(false);
    });
  }, [user]);

  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [activeShowcaseForThumbnail, setActiveShowcaseForThumbnail] = useState<any>(null);
  const [tempShowcases, setTempShowcases] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTempShowcases((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveOrder = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      tempShowcases.forEach((showcase, index) => {
        const ref = doc(db, 'showcases', showcase.id);
        batch.update(ref, { priority: index + 1 });
      });
      await batch.commit();
      setIsReorderModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(true); // Wait for snapshot slightly or just unset loading
      setLoading(false);
    }
  };

  const updateThumbnail = async (url: string) => {
    if (!activeShowcaseForThumbnail) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'showcases', activeShowcaseForThumbnail.id), {
        thumbnailUrl: url
      });
      setIsThumbnailModalOpen(false);
      setActiveShowcaseForThumbnail(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const { register, handleSubmit, reset, watch, formState: { isValid } } = useForm<ShowcaseForm>({
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

  const onSubmit = async (data: ShowcaseForm) => {
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

      const showcaseData: any = {
        userId: user.uid,
        name: data.name,
        description: data.description,
        imageUrls: finalImageUrls,
        updatedAt: serverTimestamp(),
      };

      if (editingShowcase) {
        // If image count changed and thumbnail is missing, set first image as thumbnail
        if (!editingShowcase.thumbnailUrl && finalImageUrls.length > 0) {
          showcaseData.thumbnailUrl = finalImageUrls[0];
        }
        await updateDoc(doc(db, 'showcases', editingShowcase.id), showcaseData);
      } else {
        showcaseData.createdAt = serverTimestamp();
        showcaseData.priority = showcases.length + 1;
        showcaseData.thumbnailUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : '';
        await addDoc(collection(db, 'showcases'), showcaseData);
      }

      setIsModalOpen(false);
      setEditingShowcase(null);
      setImageItems([]);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (showcase: any) => {
    setEditingShowcase(showcase);
    setImageItems(showcase.imageUrls?.map((url: string) => ({ url })) || []);
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
              setImageItems([]);
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
              <div className="flex justify-between items-center">
                <button 
                  disabled={showcases.length < 2}
                  onClick={() => {
                    setTempShowcases([...showcases]);
                    setIsReorderModalOpen(true);
                  }}
                  className="text-[8px] font-black uppercase tracking-widest text-accent-soft hover:text-accent-soft/80 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  [ Reorder Sequence ]
                </button>
                {showcases.length >= 3 && !initialLoading && (
                  <p className="text-[8px] font-black text-accent-soft uppercase tracking-widest text-right">Maximum capacity reached</p>
                )}
              </div>
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
                    {(showcase.thumbnailUrl || showcase.imageUrls?.length > 0) ? (
                       <img 
                         src={showcase.thumbnailUrl || showcase.imageUrls[0]} 
                         alt="" 
                         className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" 
                         referrerPolicy="no-referrer"
                       />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted opacity-20">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                       <button
                         onClick={() => {
                           setActiveShowcaseForThumbnail(showcase);
                           setIsThumbnailModalOpen(true);
                         }}
                         className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-black/60 transition-all border border-white/10 group/thumb"
                         title="Change Thumbnail"
                       >
                         <Camera className="w-4 h-4" />
                       </button>
                    </div>
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
              {imageItems.map((item, i) => (
                <div key={i} className="aspect-video sm:aspect-square rounded-lg overflow-hidden border border-border-subtle bg-bg-surface relative group">
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

      {/* Reorder Modal */}
      <Modal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        title="Sequence Exhibition"
        className="md:max-w-md"
        disabled={loading}
        footer={
          <button
            disabled={loading}
            onClick={saveOrder}
            className="w-full h-14 bg-accent-soft text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-soft/20"
          >
            {loading ? <LoadingSpinner variant="white" /> : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Commit Order
              </>
            )}
          </button>
        }
      >
        <div className="space-y-4">
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest italic mb-6">Drag and drop to sequence your exhibition priority.</p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tempShowcases.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {tempShowcases.map((showcase) => (
                  <SortableItem key={showcase.id} showcase={showcase} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </Modal>

      {/* Thumbnail Choice Modal */}
      <Modal
        isOpen={isThumbnailModalOpen}
        onClose={() => setIsThumbnailModalOpen(false)}
        title="Exhibition Identity"
        className="md:max-w-lg"
        disabled={loading}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Select Thumbnail</h4>
            <p className="text-xs text-text-muted">Choose the primary visual representation for <span className="text-text-main font-black italic">{activeShowcaseForThumbnail?.name}</span>.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {activeShowcaseForThumbnail?.imageUrls?.map((url: string, i: number) => {
              const isSelected = activeShowcaseForThumbnail.thumbnailUrl === url;
              return (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => updateThumbnail(url)}
                  className={cn(
                    "aspect-video rounded-2xl overflow-hidden border-2 transition-all group relative",
                    isSelected ? "border-accent-primary" : "border-border-subtle hover:border-accent-primary/30"
                  )}
                >
                  <img src={url} className={cn("w-full h-full object-cover grayscale-[0.2] transition-all", isSelected ? "grayscale-0" : "group-hover:grayscale-0")} referrerPolicy="no-referrer" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-accent-primary/20 flex items-center justify-center">
                       <Check className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 py-3 bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                     <p className="text-[8px] text-white font-black uppercase tracking-widest text-center">Choose perspective {i + 1}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SortableItem({ showcase }: { showcase: any; [key: string]: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: showcase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 bg-bg-surface border border-border-subtle rounded-2xl flex items-center gap-4 group hover:border-accent-primary/30 transition-all shadow-sm",
        isDragging && "shadow-2xl border-accent-primary/50"
      )}
    >
      <button 
        {...attributes} 
        {...listeners}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-colors cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-border-subtle shrink-0">
         <img 
           src={showcase.thumbnailUrl || showcase.imageUrls?.[0]} 
           className="w-full h-full object-cover" 
           referrerPolicy="no-referrer" 
         />
      </div>
      <div className="min-w-0 flex-1">
         <h5 className="text-[11px] font-black uppercase tracking-tight italic text-text-main truncate">{showcase.name}</h5>
         <p className="text-[9px] text-text-muted font-medium uppercase tracking-[0.1em]">Priority Position</p>
      </div>
    </div>
  );
}
