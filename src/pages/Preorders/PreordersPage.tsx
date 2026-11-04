import { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { LoadingSpinner } from '../../shared/components/Loading';
import { uploadImage } from '../../shared/services/cloudinary';
import { AddItemButton } from '../../shared/components/AddItemButton.tsx';
import { FullscreenGallery } from '../../shared/components/FullscreenGallery';
import { useForm } from 'react-hook-form';
import { formatCurrency, formatDateLong, formatMonthYear, cn } from '../../shared/utils/utils';
import { AnimatePresence } from 'motion/react';
import { Search, ChevronDown, X, ArrowUp, ArrowDown, ListFilter, Clock, CheckCircle2 } from 'lucide-react';
import { PreorderCard } from './components/PreorderCard';
import { PreorderModal } from './components/PreorderModal';
import { DeletePreorderModal } from './components/DeletePreorderModal';
import { MarkReceivedModal } from './components/MarkReceivedModal';

type FilterType = 'pending' | 'completed';
type PreorderSortField = 'arrivalDate' | 'shop' | 'price' | 'sourceSeries';
type SortOrder = 'asc' | 'desc';

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
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<PreorderSortField>('arrivalDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showSortControls, setShowSortControls] = useState(false);
  const [showMakerSuggestions, setShowMakerSuggestions] = useState(false);
  const [showAnimeSuggestions, setShowAnimeSuggestions] = useState(false);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);

  const pendingPreorders = useMemo(() => {
    return preorders.filter(p => !p.receivedAt);
  }, [preorders]);

  const completedPreorders = useMemo(() => {
    return preorders.filter(p => !!p.receivedAt);
  }, [preorders]);

  const pendingAmountToPay = useMemo(() => {
    return pendingPreorders.reduce((sum, p) => {
      const price = Number(p.preorderPrice) || 0;
      const dp = Number(p.downpayment) || 0;
      return sum + (price - dp);
    }, 0);
  }, [pendingPreorders]);

  const completedTotalCost = useMemo(() => {
    return completedPreorders.reduce((sum, p) => {
      const price = Number(p.preorderPrice) || 0;
      return sum + price;
    }, 0);
  }, [completedPreorders]);

  const displayedPreorders = useMemo(() => {
    const base = activeFilter === 'pending' ? pendingPreorders : completedPreorders;
    const searchLower = searchQuery.toLowerCase().trim();

    return base
      .filter((p) => {
        if (!searchLower) return true;
        const character = (p.characterName || p.figureName || '').toLowerCase();
        const series = (p.sourceAnime || '').toLowerCase();
        const maker = (p.maker || '').toLowerCase();
        const shop = (p.seller || '').toLowerCase();
        const line = (p.figureLine || '').toLowerCase();
        return (
          character.includes(searchLower) ||
          series.includes(searchLower) ||
          maker.includes(searchLower) ||
          shop.includes(searchLower) ||
          line.includes(searchLower)
        );
      })
      .sort((a, b) => {
        if (sortField === 'arrivalDate') {
          const aDate = a.estimatedArrivalFrom || a.estimatedArrival || (a.receivedAt ? a.receivedAt.substring(0, 7) : '');
          const bDate = b.estimatedArrivalFrom || b.estimatedArrival || (b.receivedAt ? b.receivedAt.substring(0, 7) : '');
          if (!aDate && bDate) return 1;
          if (aDate && !bDate) return -1;
          if (!aDate && !bDate) return 0;
          return sortOrder === 'asc' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
        }
        if (sortField === 'shop') {
          const aShop = (a.seller || '').toLowerCase();
          const bShop = (b.seller || '').toLowerCase();
          if (aShop < bShop) return sortOrder === 'asc' ? -1 : 1;
          if (aShop > bShop) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        }
        if (sortField === 'price') {
          const aPrice = Number(a.preorderPrice) || 0;
          const bPrice = Number(b.preorderPrice) || 0;
          return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
        }
        if (sortField === 'sourceSeries') {
          const aSeries = (a.sourceAnime || '').toLowerCase();
          const bSeries = (b.sourceAnime || '').toLowerCase();
          if (aSeries < bSeries) return sortOrder === 'asc' ? -1 : 1;
          if (aSeries > bSeries) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        }
        return 0;
      });
  }, [activeFilter, pendingPreorders, completedPreorders, searchQuery, sortField, sortOrder]);


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
    <div className="space-y-4">
      <div className="flex sticky top-[56px] md:top-0 z-30 bg-bg-deep/80 backdrop-blur-md py-4 justify-between items-end mb-4 transition-all">
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

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {[
          { 
            id: 'pending' as const, 
            label: "Pending Preorders", 
            mobileLabel: "Pending",
            value: pendingAmountToPay, 
            count: pendingPreorders.length, 
            amountLabel: "amount to pay",
            icon: Clock, 
            activeColor: "bg-emerald-500/15",
            activeBorder: "border-emerald-500", 
            hoverBorder: "hover:border-accent-primary/50" 
          },
          { 
            id: 'completed' as const, 
            label: "Completed Preorders", 
            mobileLabel: "Completed",
            value: completedTotalCost, 
            count: completedPreorders.length, 
            amountLabel: "amount paid",
            icon: CheckCircle2, 
            activeColor: "bg-emerald-500/15",
            activeBorder: "border-emerald-500", 
            hoverBorder: "hover:border-emerald-500/50" 
          }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFilter(item.id)}
            className={cn(
              "card-sophisticated p-2 sm:p-4 transition-all text-left group border-2 h-full flex flex-col justify-between",
              activeFilter === item.id 
                ? `${item.activeColor} ${item.activeBorder} shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02]` 
                : `bg-bg-surface border-transparent ${item.hoverBorder}`
            )}
          >
            <div>
              <div className={cn(
                "text-[7px] sm:text-[9px] uppercase font-black tracking-[0.1em] sm:tracking-[0.2em] flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3",
                activeFilter === item.id ? "text-emerald-600 dark:text-emerald-400" : "text-text-muted"
              )}>
                <div className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all",
                  activeFilter === item.id ? "bg-emerald-500 text-white" : "bg-accent-primary/5 text-accent-primary group-hover:bg-accent-primary group-hover:text-white"
                )}>
                  <item.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="truncate">
                  <span className="sm:hidden">{item.mobileLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1">
                <p className={cn(
                  "text-[10px] sm:text-lg lg:text-xl font-black tracking-tighter truncate",
                  activeFilter === item.id ? "text-text-main" : "text-text-main"
                )}>
                  {item.count} {item.count === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            
            <p className={cn(
              "text-[7px] sm:text-[10px] font-bold tracking-tight sm:tracking-wider mt-2 opacity-70 truncate",
              activeFilter === item.id ? "text-text-muted" : "text-text-muted"
            )}>
              <span className="font-extrabold text-text-main">{formatCurrency(item.value)}</span>{' '}
              <span>{item.amountLabel}</span>
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search characters, series, shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl pl-11 pr-4 text-sm focus:ring-1 focus:ring-accent-primary outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-deep rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-text-muted" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowSortControls(!showSortControls)}
            className="md:hidden h-12 w-12 flex items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl text-text-muted hover:text-accent-primary transition-colors shrink-0"
          >
            <ListFilter className={cn("w-5 h-5 transition-transform", showSortControls && "rotate-180")} />
          </button>
        </div>
        <div className={cn(
          "flex items-center gap-2 w-full md:w-auto transition-all overflow-hidden",
          !showSortControls && "max-md:h-0 max-md:opacity-0 max-md:pointer-events-none"
        )}>
          <div className="relative flex-1 md:w-48">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as PreorderSortField)}
              className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl px-4 text-sm focus:ring-1 focus:ring-accent-primary outline-none appearance-none cursor-pointer pr-10 font-bold"
            >
              <option value="arrivalDate">Arrival Date</option>
              <option value="shop">Shop</option>
              <option value="price">Price</option>
              <option value="sourceSeries">Source Series</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-12 w-12 flex items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl text-text-muted hover:text-accent-primary transition-colors shrink-0"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-accent-primary" /> : <ArrowDown className="w-4 h-4 text-accent-primary" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {initialLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
            <LoadingSpinner variant="brand" />
            <p className="text-xs font-black uppercase tracking-widest italic animate-pulse">Scanning Future Cargo...</p>
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
                formatDateLong={formatDateLong}
                formatMonthYear={formatMonthYear}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {!initialLoading && displayedPreorders.length === 0 && (
        <div className="py-20 text-center text-text-muted italic opacity-50 surface-container">
          {searchQuery
            ? `No preorders found matching "${searchQuery}".`
            : activeFilter === 'pending'
              ? 'No pending preorders currently in the pipeline.'
              : 'No completed preorders recorded yet.'}
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
