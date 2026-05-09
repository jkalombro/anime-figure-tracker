import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { LoadingSpinner } from '../../shared/components/Loading';
import { uploadImage } from '../../shared/services/cloudinary';
import { AddItemButton } from '../../shared/components/AddItemButton.tsx';
import { FullscreenGallery } from '../../shared/components/FullscreenGallery';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '../../shared/utils/utils';
import { AnimatePresence } from 'motion/react';
import { PreorderCard } from './components/PreorderCard';
import { PreorderModal } from './components/PreorderModal';
import { DeletePreorderModal } from './components/DeletePreorderModal';
import { MarkReceivedModal } from './components/MarkReceivedModal';

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

  const formMethods = useForm<PreorderForm>({
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
      <div className="flex sticky top-[56px] md:top-0 z-30 bg-bg-deep/80 backdrop-blur-md py-4 justify-between items-end mb-8 transition-all">
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
      />
    </div>
  );
}
