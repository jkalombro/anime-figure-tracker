import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { LoadingSpinner } from '../../shared/components/Loading';
import { uploadImage } from '../../shared/services/cloudinary';
import { AddItemButton } from '../../shared/components/AddItemButton.tsx';
import { Plus, Link as LinkIcon, ImageIcon, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../../shared/utils/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ShowcaseCard } from './components/ShowcaseCard';
import { ShowcaseModal } from './components/ShowcaseModal';
import { DeleteShowcaseModal } from './components/DeleteShowcaseModal';
import { ReorderModal } from './components/ReorderModal';
import { ThumbnailModal } from './components/ThumbnailModal';
import { FeaturedItemsModal } from './components/FeaturedItemsModal';

interface ShowcaseForm {
  name: string;
  description: string;
  images?: FileList;
}

export function ShowcasePage() {
  const { user } = useAuth();
  const [showcases, setShowcases] = useState<any[]>([]);
  const [figures, setFigures] = useState<any[]>([]);
  const [featuredFigureIds, setFeaturedFigureIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [imageItems, setImageItems] = useState<{ url: string; file?: File }[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showcaseToDelete, setShowcaseToDelete] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    setInitialLoading(true);
    
    // Fetch Showcases
    const qShowcases = query(collection(db, 'showcases'), where('userId', '==', user.uid));
    const unsubscribeShowcases = onSnapshot(qShowcases, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      docs.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      setShowcases(docs);
    });

    // Fetch All Figures for selection
    const qFigures = query(collection(db, 'actionFigures'), where('userId', '==', user.uid));
    const unsubscribeFigures = onSnapshot(qFigures, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      docs.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA;
      });
      setFigures(docs);
    });

    // Fetch User metadata (featured IDs)
    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setFeaturedFigureIds(doc.data().featuredFigureIds || []);
      }
      setInitialLoading(false);
    });

    return () => {
      unsubscribeShowcases();
      unsubscribeFigures();
      unsubscribeUser();
    };
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

  const saveFeaturedItems = async (ids: string[]) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        featuredFigureIds: ids
      });
      setIsFeatureModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formMethods = useForm<ShowcaseForm>({
    mode: 'onChange'
  });
  const { reset, watch } = formMethods;

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
          <AddItemButton 
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
            label="Add Showcase"
            disabled={showcases.length >= 3}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Capacity Indicator - Showcases */}
          <div className="card-sophisticated p-6 bg-gradient-to-r from-accent-primary/5 via-accent-soft/5 to-transparent border-border-subtle hover:border-accent-primary/20 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">Showcase Capacity</h4>
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
                    <p className="text-[8px] font-black text-accent-soft uppercase tracking-widest text-right">Max capacity</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Indicator - Featured Items */}
          <div className="card-sophisticated p-6 bg-gradient-to-r from-accent-soft/5 via-accent-primary/5 to-transparent border-border-subtle hover:border-accent-soft/20 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">Featured Items capacity</h4>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{initialLoading ? '...' : featuredFigureIds.length} / 9 slots utilized</p>
              </div>
              <div className="flex-1 max-w-xs space-y-2">
                <div className="h-1.5 w-full bg-bg-deep rounded-full overflow-hidden border border-border-subtle">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(featuredFigureIds.length / 9) * 100}%` }}
                    className={cn(
                      "h-full transition-all duration-1000",
                      featuredFigureIds.length >= 9 ? "bg-accent-primary" : "bg-accent-soft"
                    )}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setIsFeatureModalOpen(true)}
                    className="text-[8px] font-black uppercase tracking-widest text-accent-primary hover:text-accent-primary/80 transition-colors"
                  >
                    [ Select featured ]
                  </button>
                  {featuredFigureIds.length >= 9 && !initialLoading && (
                    <p className="text-[8px] font-black text-accent-primary uppercase tracking-widest text-right">Max capacity</p>
                  )}
                </div>
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
                <ShowcaseCard
                  key={showcase.id}
                  showcase={showcase}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onChangeThumbnail={(showcase) => {
                    setActiveShowcaseForThumbnail(showcase);
                    setIsThumbnailModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ShowcaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingShowcase={editingShowcase}
        loading={loading}
        formMethods={formMethods}
        onSubmit={onSubmit}
        imageItems={imageItems}
        setImageItems={setImageItems}
      />

      <DeleteShowcaseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        loading={loading}
        onConfirm={confirmDelete}
      />

      <ReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        loading={loading}
        tempShowcases={tempShowcases}
        onDragEnd={handleDragEnd}
        onSave={saveOrder}
        sensors={sensors}
      />

      <ThumbnailModal
        isOpen={isThumbnailModalOpen}
        onClose={() => setIsThumbnailModalOpen(false)}
        loading={loading}
        activeShowcase={activeShowcaseForThumbnail}
        onUpdateThumbnail={updateThumbnail}
      />

      <FeaturedItemsModal
        isOpen={isFeatureModalOpen}
        onClose={() => setIsFeatureModalOpen(false)}
        loading={loading}
        figures={figures}
        featuredFigureIds={featuredFigureIds}
        setFeaturedFigureIds={setFeaturedFigureIds}
        onSave={saveFeaturedItems}
      />
    </div>
  );
}
