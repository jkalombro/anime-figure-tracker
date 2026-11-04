import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { LoadingSpinner } from '../../shared/components/Loading';
import { uploadImage } from '../../shared/services/cloudinary';
import { AddItemButton } from '../../shared/components/AddItemButton.tsx';
import { FullscreenGallery } from '../../shared/components/FullscreenGallery';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'motion/react';

// Subcomponents & Hooks
import { FigureCard } from './components/FigureCard';
import { FigureStatsCards } from './components/FigureStatsCards';
import { FigureToolbar } from './components/FigureToolbar';
import { FigureModal } from './components/FigureModal';
import { DeleteFigureModal } from './components/DeleteFigureModal';
import { useFigureFilter } from './hooks/useFigureFilter';

export interface FigureForm {
  characterName: string;
  maker: string;
  figureLine: string;
  totalPrice: number | null;
  condition: 'MSIB' | 'MIB' | 'BIB' | 'LOOSE' | 'PRE-ORDERED';
  sourceAnime: string;
  seasonArc?: string;
  images?: FileList;
  isGifted: boolean;
  isSold: boolean;
  isLost: boolean;
  description?: string;
}

export function ActionFiguresPage() {
  const { user } = useAuth();
  const [figures, setFigures] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Modals & Editing State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFigure, setEditingFigure] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [figureToDelete, setFigureToDelete] = useState<any>(null);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[] | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  // Suggestions & Image uploads
  const [imageItems, setImageItems] = useState<{ url: string; file?: File }[]>([]);
  const [makersSuggestions, setMakersSuggestions] = useState<string[]>([]);
  const [animeSuggestions, setAnimeSuggestions] = useState<string[]>([]);
  const [showMakerSuggestions, setShowMakerSuggestions] = useState(false);
  const [showAnimeSuggestions, setShowAnimeSuggestions] = useState(false);

  // Filtering & Sorting Hook
  const {
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortOrder,
    toggleSortOrder,
    isFiltering,
    displayFigures,
    totalBasePrice,
    purchasedBasePrice,
    giftsBasePrice,
    totalFiguresCount,
    totalPurchasedCount,
    totalGiftsCount,
  } = useFigureFilter(figures, initialLoading);

  // Subscribe to user figures
  useEffect(() => {
    if (!user) return;
    setInitialLoading(true);
    const q = query(collection(db, 'actionFigures'), where('userId', '==', user.uid));
    return onSnapshot(
      q,
      (snapshot) => {
        setFigures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setInitialLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'actionFigures');
      }
    );
  }, [user]);

  // Load Intellisense suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isModalOpen) {
        try {
          const makersSnap = await getDocs(collection(db, 'makers'))
            .catch(err => { handleFirestoreError(err, OperationType.GET, 'makers'); throw err; });
          const animeSnap = await getDocs(collection(db, 'anime'))
            .catch(err => { handleFirestoreError(err, OperationType.GET, 'anime'); throw err; });

          const uniqueMakers = Array.from(new Set(makersSnap.docs.map(doc => doc.data().name?.trim()))).filter(Boolean);
          const uniqueAnime = Array.from(new Set(animeSnap.docs.map(doc => doc.data().title?.trim()))).filter(Boolean);

          setMakersSuggestions(uniqueMakers);
          setAnimeSuggestions(uniqueAnime);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }
    };
    fetchSuggestions();
  }, [isModalOpen]);

  // Form Management
  const formMethods = useForm<FigureForm>({ mode: 'onChange' });
  const { reset, setValue, watch } = formMethods;
  const watchedMaker = watch('maker');
  const watchedAnime = watch('sourceAnime');
  const watchedImages = watch('images');
  const watchedIsSold = watch('isSold');
  const watchedIsLost = watch('isLost');

  useEffect(() => {
    if (watchedIsSold) setValue('isLost', false);
  }, [watchedIsSold, setValue]);

  useEffect(() => {
    if (watchedIsLost) setValue('isSold', false);
  }, [watchedIsLost, setValue]);

  useEffect(() => {
    if (watchedImages && watchedImages.length > 0) {
      const newFiles = Array.from(watchedImages);
      const newItems = newFiles.map(file => ({
        url: URL.createObjectURL(file),
        file,
      }));

      setImageItems(prev => [...prev, ...newItems].slice(0, 3));
      return () => newItems.forEach(item => URL.revokeObjectURL(item.url));
    }
  }, [watchedImages]);

  const handleOpenAdd = () => {
    setEditingFigure(null);
    setImageItems([]);
    reset({
      characterName: '',
      maker: '',
      figureLine: '',
      totalPrice: null,
      condition: 'MSIB',
      sourceAnime: '',
      isGifted: false,
      isSold: false,
      isLost: false,
      description: '',
    });
    setIsModalOpen(true);
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
      condition: figure.condition || 'MSIB',
      sourceAnime: figure.sourceAnime,
      isGifted: figure.isGifted || false,
      isSold: figure.isSold || false,
      isLost: figure.isLost || false,
      description: figure.description || '',
    });
  };

  const handleDelete = (figure: any) => {
    setFigureToDelete(figure);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!figureToDelete) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'actionFigures', figureToDelete.id))
        .catch(err => { handleFirestoreError(err, OperationType.DELETE, `actionFigures/${figureToDelete.id}`); throw err; });
      setIsDeleteModalOpen(false);
      setFigureToDelete(null);
    } catch (error) {
      console.error('Error deleting figure:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FigureForm) => {
    if (!user) return;
    setLoading(true);
    try {
      setShowAnimeSuggestions(false);
      setShowMakerSuggestions(false);
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
        condition: data.condition,
        sourceAnime: data.sourceAnime.trim(),
        isGifted: data.isGifted,
        isSold: data.isSold || false,
        isLost: data.isLost || false,
        description: data.description || '',
        imageUrls: finalImageUrls,
        createdAt: editingFigure ? editingFigure.createdAt : serverTimestamp(),
      };

      if (editingFigure) {
        await updateDoc(doc(db, 'actionFigures', editingFigure.id), figureData)
          .catch(err => { handleFirestoreError(err, OperationType.UPDATE, `actionFigures/${editingFigure.id}`); throw err; });
      } else {
        await addDoc(collection(db, 'actionFigures'), figureData)
          .catch(err => { handleFirestoreError(err, OperationType.CREATE, 'actionFigures'); throw err; });
      }

      // Sync suggestions
      const makerExists = makersSuggestions.some(m => m.toLowerCase() === figureData.maker.toLowerCase());
      if (!makerExists && figureData.maker) {
        await addDoc(collection(db, 'makers'), { name: figureData.maker, addedBy: user.uid })
          .catch(err => { handleFirestoreError(err, OperationType.CREATE, 'makers'); throw err; });
      }

      const animeExists = animeSuggestions.some(a => a.toLowerCase() === figureData.sourceAnime.toLowerCase());
      if (!animeExists && figureData.sourceAnime) {
        await addDoc(collection(db, 'anime'), { title: figureData.sourceAnime, addedBy: user.uid })
          .catch(err => { handleFirestoreError(err, OperationType.CREATE, 'anime'); throw err; });
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

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex sticky top-[56px] md:top-0 z-30 bg-bg-deep/80 backdrop-blur-md py-4 justify-between items-end mb-4 transition-all">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-text-main uppercase tracking-tighter italic">Action Figures</h2>
          <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Catalog Archive</p>
        </div>
        <AddItemButton onClick={handleOpenAdd} label="Add New Figure" />
      </div>

      {/* Top Filter & Metric Cards */}
      <FigureStatsCards
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalPrice={totalBasePrice}
        purchasedPrice={purchasedBasePrice}
        giftsPrice={giftsBasePrice}
        totalCount={totalFiguresCount}
        purchasedCount={totalPurchasedCount}
        giftsCount={totalGiftsCount}
      />

      {/* Search & Sorting Toolbar */}
      <FigureToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortOrder={sortOrder}
        onSortOrderToggle={toggleSortOrder}
      />

      {/* Figures Listing */}
      <div className="space-y-4">
        {initialLoading || isFiltering ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
            <LoadingSpinner variant="brand" />
            <p className="text-xs font-black uppercase tracking-widest italic animate-pulse">
              {initialLoading ? 'Sourcing Archives...' : 'Refining Catalog...'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayFigures.map((figure) => (
              <FigureCard
                key={figure.id}
                figure={figure}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewGallery={(images) => {
                  setSelectedGalleryImages(images);
                  setCurrentGalleryIndex(0);
                }}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Empty State */}
      {!initialLoading && !isFiltering && displayFigures.length === 0 && (
        <div className="py-32 text-center text-text-muted italic opacity-50 surface-container">
          {figures.length === 0
            ? 'Your collection catalog is empty. Start by recording your first grail.'
            : 'No figures match your search or filter.'}
        </div>
      )}

      {/* Fullscreen Gallery */}
      {selectedGalleryImages && (
        <FullscreenGallery
          images={selectedGalleryImages}
          initialIndex={currentGalleryIndex}
          onClose={() => setSelectedGalleryImages(null)}
          accentColor="var(--color-accent-primary)"
        />
      )}

      {/* Create / Edit Modal */}
      <FigureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingFigure={editingFigure}
        loading={loading}
        formMethods={formMethods}
        onSubmit={onSubmit}
        watchedIsSold={watchedIsSold}
        watchedIsLost={watchedIsLost}
        watchedAnime={watchedAnime}
        watchedMaker={watchedMaker}
        animeSuggestions={animeSuggestions}
        makersSuggestions={makersSuggestions}
        showAnimeSuggestions={showAnimeSuggestions}
        showMakerSuggestions={showMakerSuggestions}
        setShowAnimeSuggestions={setShowAnimeSuggestions}
        setShowMakerSuggestions={setShowMakerSuggestions}
        imageItems={imageItems}
        setImageItems={setImageItems}
      />

      {/* Delete Confirmation Modal */}
      <DeleteFigureModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        loading={loading}
        figureToDelete={figureToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
