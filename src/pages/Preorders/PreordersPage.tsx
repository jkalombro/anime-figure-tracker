import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { LoadingSpinner } from '../../shared/components/Loading';
import { uploadImage } from '../../shared/services/cloudinary';
import { AddItemButton } from '../../shared/components/AddItemButton.tsx';
import { FullscreenGallery } from '../../shared/components/FullscreenGallery';
import { useForm } from 'react-hook-form';
import { formatCurrency, formatDateLong, formatMonthYear } from '../../shared/utils/utils';
import { AnimatePresence } from 'motion/react';
import { PreorderCard } from './components/PreorderCard';
import { PreorderModal } from './components/PreorderModal';
import { DeletePreorderModal } from './components/DeletePreorderModal';
import { MarkReceivedModal } from './components/MarkReceivedModal';

interface PreorderForm {
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
  const [receivedStatus, setReceivedStatus] = useState<string | undefined>(undefined);
  const [makersSuggestions, setMakersSuggestions] = useState<string[]>([]);
  const [animeSuggestions, setAnimeSuggestions] = useState<string[]>([]);
  const [shopsSuggestions, setShopsSuggestions] = useState<string[]>([]);
  const [showMakerSuggestions, setShowMakerSuggestions] = useState(false);
  const [showAnimeSuggestions, setShowAnimeSuggestions] = useState(false);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);


  useEffect(() => {
    if (!user) return;
    setInitialLoading(true);
    const q = query(collection(db, 'preorders'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      const sorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aReceived = !!a.receivedAt;
          const bReceived = !!b.receivedAt;
          
          // First criteria: Received status (unreceived first)
          if (aReceived !== bReceived) return aReceived ? 1 : -1;
          
          // Second criteria: Estimated arrival (nearest first)
          // Handle missing dates by pushing them to the end of their category
          const aDate = a.estimatedArrivalFrom || (aReceived ? '9999-99' : '9999-99');
          const bDate = b.estimatedArrivalFrom || (bReceived ? '9999-99' : '9999-99');
          
          if (!a.estimatedArrivalFrom && b.estimatedArrivalFrom) return 1;
          if (a.estimatedArrivalFrom && !b.estimatedArrivalFrom) return -1;
          
          return aDate.localeCompare(bDate);
        });
      setPreorders(sorted);
      setInitialLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'preorders');
    });
  }, [user]);

  const formMethods = useForm<PreorderForm>({
    mode: 'onChange'
  });
  const { reset, watch, setValue } = formMethods;
  const watchedImages = watch('images');
  const watchedMaker = watch('maker');
  const watchedAnime = watch('sourceAnime');
  const watchedSeller = watch('seller');

  const getStoredShops = (): string[] => {
    try {
      const raw = localStorage.getItem('kuradex_saved_shops');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveStoredShop = (shopName: string) => {
    if (!shopName) return;
    try {
      const existing = getStoredShops();
      const clean = shopName.trim();
      if (clean && !existing.some(s => s.toLowerCase() === clean.toLowerCase())) {
        localStorage.setItem('kuradex_saved_shops', JSON.stringify([...existing, clean]));
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isModalOpen) {
        try {
          const makersSnap = await getDocs(collection(db, 'makers'))
            .catch(err => { handleFirestoreError(err, OperationType.GET, 'makers'); throw err; });
          const animeSnap = await getDocs(collection(db, 'anime'))
            .catch(err => { handleFirestoreError(err, OperationType.GET, 'anime'); throw err; });
          
          let dbShops: string[] = [];
          try {
            const shopsSnap = await getDocs(collection(db, 'shops'));
            dbShops = shopsSnap.docs.map(doc => doc.data().name?.trim()).filter(Boolean);
          } catch {
            // Silently fall back if remote collection rules are not configured yet
          }
          
          const localShops = getStoredShops();
          const existingPreorderShops = preorders.map(p => p.seller?.trim()).filter(Boolean);
          const uniqueShops = Array.from(new Set([...localShops, ...dbShops, ...existingPreorderShops]));

          const uniqueMakers = Array.from(new Set(makersSnap.docs.map(doc => doc.data().name?.trim()))).filter(Boolean);
          const uniqueAnime = Array.from(new Set(animeSnap.docs.map(doc => doc.data().title?.trim()))).filter(Boolean);
          
          setMakersSuggestions(uniqueMakers);
          setAnimeSuggestions(uniqueAnime);
          setShopsSuggestions(uniqueShops);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      }
    };
    fetchSuggestions();
  }, [isModalOpen, preorders]);

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

      // Sync Intellisense Collections
      const makerExists = makersSuggestions.some(m => m.toLowerCase() === preorderData.maker.toLowerCase());
      if (!makerExists && preorderData.maker) {
        await addDoc(collection(db, 'makers'), { name: preorderData.maker, addedBy: user.uid })
          .catch(err => { handleFirestoreError(err, OperationType.CREATE, 'makers'); throw err; });
      }
      
      const animeExists = animeSuggestions.some(a => a.toLowerCase() === preorderData.sourceAnime.toLowerCase());
      if (!animeExists && preorderData.sourceAnime) {
        await addDoc(collection(db, 'anime'), { title: preorderData.sourceAnime, addedBy: user.uid })
          .catch(err => { handleFirestoreError(err, OperationType.CREATE, 'anime'); throw err; });
      }

      if (preorderData.seller) {
        saveStoredShop(preorderData.seller);
        const shopExists = shopsSuggestions.some(s => s.toLowerCase() === preorderData.seller.toLowerCase());
        if (!shopExists) {
          try {
            await addDoc(collection(db, 'shops'), { name: preorderData.seller, addedBy: user.uid });
          } catch {
            // Silently fallback; shop is already safely persisted in the preorder record and localStorage
          }
        }
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
      await deleteDoc(doc(db, 'preorders', preorderToDelete.id))
        .catch(err => { handleFirestoreError(err, OperationType.DELETE, `preorders/${preorderToDelete.id}`); throw err; });
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

  const confirmReceived = async () => {
    if (!preorderToMark || !user) return;
    setLoading(true);
    setReceivedStatus('Marking preorder as received...');
    try {
      // 1. Update Preorder
      await updateDoc(doc(db, 'preorders', preorderToMark.id), {
        receivedAt: receivedDate,
        updatedAt: serverTimestamp()
      }).catch(err => { handleFirestoreError(err, OperationType.UPDATE, `preorders/${preorderToMark.id}`); throw err; });
      
      setReceivedStatus('Adding to Action Figure catalog...');
      
      // 2. Create Figure Entry Automatically
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

      // Sync Intellisense Collections
      if (figureData.maker) {
        const makerExists = makersSuggestions.some(m => m.toLowerCase() === figureData.maker.toLowerCase());
        if (!makerExists) {
          await addDoc(collection(db, 'makers'), { name: figureData.maker, addedBy: user.uid })
            .catch(err => { handleFirestoreError(err, OperationType.CREATE, 'makers'); throw err; });
        }
      }
      
      if (figureData.sourceAnime) {
        const animeExists = animeSuggestions.some(a => a.toLowerCase() === figureData.sourceAnime.toLowerCase());
        if (!animeExists) {
          await addDoc(collection(db, 'anime'), { title: figureData.sourceAnime, addedBy: user.uid })
            .catch(err => { handleFirestoreError(err, OperationType.CREATE, 'anime'); throw err; });
        }
      }

      setReceivedStatus('Successfully added to catalog!');
      
      // Delay closing to show success message
      setTimeout(() => {
        setIsReceivedModalOpen(false);
        setPreorderToMark(null);
        setReceivedStatus(undefined);
      }, 1500);

    } catch (error) {
      console.error("Error marking as received:", error);
      setReceivedStatus('Error encountered during check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex sticky top-[56px] md:top-0 z-30 bg-bg-deep/80 backdrop-blur-md py-4 justify-between items-end mb-8 transition-all">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-text-main uppercase tracking-tighter italic">Preorders</h2>
          <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Pipeline Track</p>
        </div>
        <AddItemButton 
          onClick={() => { 
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
              downpayment: null 
            }); 
            setIsModalOpen(true); 
          }}
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
                formatDateLong={formatDateLong}
                formatMonthYear={formatMonthYear}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {!initialLoading && preorders.length === 0 && (
        <div className="py-20 text-center text-text-muted italic opacity-50 surface-container">
          No preorders currently in the pipeline.
        </div>
      )}

      {selectedGalleryImages && (
        <FullscreenGallery 
          images={selectedGalleryImages}
          initialIndex={currentGalleryIndex}
          onClose={() => setSelectedGalleryImages(null)}
          accentColor="var(--color-accent-primary)"
        />
      )}

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

      <DeletePreorderModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        loading={loading}
        preorderToDelete={preorderToDelete}
        onConfirm={confirmDelete}
      />

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
