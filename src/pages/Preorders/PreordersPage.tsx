import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { LoadingSpinner } from '../../shared/components/Loading';
import { uploadImage } from '../../shared/services/cloudinary';
import { AddItemButton } from '../../shared/components/AddItemButton.tsx';
import { FullscreenGallery } from '../../shared/components/FullscreenGallery';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'motion/react';

// Subcomponents & Hooks
import { PreorderCard } from './components/PreorderCard';
import { PreorderStatsCards } from './components/PreorderStatsCards';
import { PreorderToolbar } from './components/PreorderToolbar';
import { PreorderModal } from './components/PreorderModal';
import { DeletePreorderModal } from './components/DeletePreorderModal';
import { MarkReceivedModal } from './components/MarkReceivedModal';
import { usePreorderFilter } from './hooks/usePreorderFilter';
import { usePreorderSuggestions } from './hooks/usePreorderSuggestions';

export interface PreorderForm {
  characterName: string;
  sourceAnime: string;
  maker: string;
  figureLine: string;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Modals & Selection State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreorder, setEditingPreorder] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [preorderToDelete, setPreorderToDelete] = useState<any>(null);
  const [isReceivedModalOpen, setIsReceivedModalOpen] = useState(false);
  const [preorderToMark, setPreorderToMark] = useState<any>(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedStatus, setReceivedStatus] = useState<string | undefined>(undefined);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[] | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  // Image Uploads State
  const [imageItems, setImageItems] = useState<{ url: string; file?: File }[]>([]);

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
    pendingPreorders,
    completedPreorders,
    pendingAmountToPay,
    completedTotalCost,
    displayedPreorders,
  } = usePreorderFilter(preorders, initialLoading);

  // Suggestions Hook
  const {
    makersSuggestions,
    animeSuggestions,
    shopsSuggestions,
    showMakerSuggestions,
    setShowMakerSuggestions,
    showAnimeSuggestions,
    setShowAnimeSuggestions,
    showShopSuggestions,
    setShowShopSuggestions,
    syncNewSuggestions,
  } = usePreorderSuggestions(isModalOpen, preorders);

  // Subscribe to user preorders
  useEffect(() => {
    if (!user) return;
    setInitialLoading(true);
    const q = query(collection(db, 'preorders'), where('userId', '==', user.uid));
    return onSnapshot(
      q,
      (snapshot) => {
        const sorted = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => {
            const aReceived = !!a.receivedAt;
            const bReceived = !!b.receivedAt;
            if (aReceived !== bReceived) return aReceived ? 1 : -1;
            const aDate = a.estimatedArrivalFrom || '9999-99';
            const bDate = b.estimatedArrivalFrom || '9999-99';
            if (!a.estimatedArrivalFrom && b.estimatedArrivalFrom) return 1;
            if (a.estimatedArrivalFrom && !b.estimatedArrivalFrom) return -1;
            return aDate.localeCompare(bDate);
          });
        setPreorders(sorted);
        setInitialLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'preorders');
      }
    );
  }, [user]);

  // Form Management
  const formMethods = useForm<PreorderForm>({ mode: 'onChange' });
  const { reset, watch } = formMethods;
  const watchedImages = watch('images');
  const watchedMaker = watch('maker');
  const watchedAnime = watch('sourceAnime');
  const watchedSeller = watch('seller');

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
    setEditingPreorder(null);
    setImageItems([]);
    reset({
      characterName: '',
      sourceAnime: '',
      maker: '',
      figureLine: '',
      seller: '',
      datePreordered: '',
      estimatedArrivalFrom: '',
      estimatedArrivalTo: '',
      preorderPrice: null,
      downpayment: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (preorder: any) => {
    setEditingPreorder(preorder);
    setImageItems(preorder.imageUrls?.map((url: string) => ({ url })) || []);
    setIsModalOpen(true);
    reset({
      characterName: preorder.characterName || preorder.figureName,
      sourceAnime: preorder.sourceAnime || '',
      maker: preorder.maker || '',
      figureLine: preorder.figureLine || '',
      seller: preorder.seller,
      datePreordered: preorder.datePreordered,
      estimatedArrivalFrom: preorder.estimatedArrivalFrom || preorder.estimatedArrival || '',
      estimatedArrivalTo: preorder.estimatedArrivalTo || '',
      preorderPrice: preorder.preorderPrice ?? null,
      downpayment: preorder.downpayment ?? null,
    });
  };

  const handleDelete = (preorder: any) => {
    setPreorderToDelete(preorder);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!preorderToDelete) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'preorders', preorderToDelete.id))
        .catch(err => { handleFirestoreError(err, OperationType.DELETE, `preorders/${preorderToDelete.id}`); throw err; });
      setIsDeleteModalOpen(false);
      setPreorderToDelete(null);
    } catch (error) {
      console.error('Error deleting preorder:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PreorderForm) => {
    if (!user) return;
    setLoading(true);
    try {
      setShowAnimeSuggestions(false);
      setShowMakerSuggestions(false);
      setShowShopSuggestions(false);
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
        characterName: data.characterName,
        sourceAnime: data.sourceAnime.trim(),
        maker: data.maker.trim(),
        figureLine: data.figureLine || '',
        seller: (data.seller || '').trim(),
        datePreordered: data.datePreordered,
        estimatedArrivalFrom: data.estimatedArrivalFrom,
        estimatedArrivalTo: data.estimatedArrivalTo || null,
        preorderPrice: data.preorderPrice !== null ? Number(data.preorderPrice) : 0,
        downpayment: data.downpayment !== null ? Number(data.downpayment) : 0,
        imageUrls: finalImageUrls,
        createdAt: editingPreorder ? editingPreorder.createdAt : serverTimestamp(),
      };

      if (editingPreorder) {
        await updateDoc(doc(db, 'preorders', editingPreorder.id), preorderData)
          .catch(err => { handleFirestoreError(err, OperationType.UPDATE, `preorders/${editingPreorder.id}`); throw err; });
      } else {
        await addDoc(collection(db, 'preorders'), preorderData)
          .catch(err => { handleFirestoreError(err, OperationType.CREATE, 'preorders'); throw err; });
      }

      await syncNewSuggestions(user.uid, preorderData);

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

  const confirmReceived = async () => {
    if (!preorderToMark || !user) return;
    setLoading(true);
    setReceivedStatus('Marking preorder as received...');
    try {
      await updateDoc(doc(db, 'preorders', preorderToMark.id), {
        receivedAt: receivedDate,
        updatedAt: serverTimestamp(),
      }).catch(err => { handleFirestoreError(err, OperationType.UPDATE, `preorders/${preorderToMark.id}`); throw err; });

      setReceivedStatus('Adding to Action Figure catalog...');

      const figureData: any = {
        userId: user.uid,
        characterName: preorderToMark.characterName || preorderToMark.figureName,
        maker: (preorderToMark.maker || '').trim(),
        figureLine: preorderToMark.figureLine || '',
        totalPrice: preorderToMark.preorderPrice !== null ? Number(preorderToMark.preorderPrice) : 0,
        condition: 'PRE-ORDERED',
        sourceAnime: (preorderToMark.sourceAnime || '').trim(),
        isGifted: false,
        isSold: false,
        isLost: false,
        description: `Source Preorder: ${preorderToMark.seller} (${preorderToMark.datePreordered})`,
        imageUrls: preorderToMark.imageUrls || [],
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'actionFigures'), figureData)
        .catch(err => { handleFirestoreError(err, OperationType.CREATE, 'actionFigures'); throw err; });

      await syncNewSuggestions(user.uid, { maker: figureData.maker, sourceAnime: figureData.sourceAnime });

      setReceivedStatus('Successfully added to catalog!');

      setTimeout(() => {
        setIsReceivedModalOpen(false);
        setPreorderToMark(null);
        setReceivedStatus(undefined);
      }, 1500);
    } catch (error) {
      console.error('Error marking as received:', error);
      setReceivedStatus('Error encountered during check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex sticky top-[56px] md:top-0 z-30 bg-bg-deep/80 backdrop-blur-md py-4 justify-between items-end mb-4 transition-all">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-text-main uppercase tracking-tighter italic">Preorders</h2>
          <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Pipeline Track</p>
        </div>
        <AddItemButton onClick={handleOpenAdd} label="Add Preorder" />
      </div>

      {/* Top Filter & Metric Cards */}
      <PreorderStatsCards
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        pendingCount={pendingPreorders.length}
        pendingAmountToPay={pendingAmountToPay}
        completedCount={completedPreorders.length}
        completedTotalCost={completedTotalCost}
      />

      {/* Search & Sort Toolbar */}
      <PreorderToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortOrder={sortOrder}
        onSortOrderToggle={toggleSortOrder}
      />

      {/* Preorders Listing */}
      <div className="space-y-4">
        {initialLoading || isFiltering ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
            <LoadingSpinner variant="brand" />
            <p className="text-xs font-black uppercase tracking-widest italic animate-pulse">
              {initialLoading ? 'Scanning Future Cargo...' : 'Refining Pipeline...'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayedPreorders.map((preorder) => (
              <PreorderCard
                key={preorder.id}
                preorder={preorder}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMarkReceived={(p) => {
                  setPreorderToMark(p);
                  setReceivedDate(new Date().toISOString().split('T')[0]);
                  setIsReceivedModalOpen(true);
                }}
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
      {!initialLoading && !isFiltering && displayedPreorders.length === 0 && (
        <div className="py-20 text-center text-text-muted italic opacity-50 surface-container">
          {searchQuery
            ? `No preorders found matching "${searchQuery}".`
            : activeFilter === 'pending'
              ? 'No pending preorders currently in the pipeline.'
              : 'No completed preorders recorded yet.'}
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
      <PreorderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingPreorder={editingPreorder}
        loading={loading}
        formMethods={formMethods}
        onSubmit={onSubmit}
        imageItems={imageItems}
        setImageItems={setImageItems}
        watchedAnime={watchedAnime}
        watchedMaker={watchedMaker}
        watchedSeller={watchedSeller}
        animeSuggestions={animeSuggestions}
        makersSuggestions={makersSuggestions}
        shopsSuggestions={shopsSuggestions}
        showAnimeSuggestions={showAnimeSuggestions}
        showMakerSuggestions={showMakerSuggestions}
        showShopSuggestions={showShopSuggestions}
        setShowAnimeSuggestions={setShowAnimeSuggestions}
        setShowMakerSuggestions={setShowMakerSuggestions}
        setShowShopSuggestions={setShowShopSuggestions}
      />

      {/* Delete Modal */}
      <DeletePreorderModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        loading={loading}
        preorderToDelete={preorderToDelete}
        onConfirm={confirmDelete}
      />

      {/* Mark Received Modal */}
      <MarkReceivedModal
        isOpen={isReceivedModalOpen}
        onClose={() => setIsReceivedModalOpen(false)}
        loading={loading}
        preorderToMark={preorderToMark}
        receivedDate={receivedDate}
        setReceivedDate={setReceivedDate}
        onConfirm={confirmReceived}
        status={receivedStatus}
      />
    </div>
  );
}
