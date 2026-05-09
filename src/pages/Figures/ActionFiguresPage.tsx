import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { LoadingSpinner } from '../../shared/components/Loading';
import { uploadImage } from '../../shared/services/cloudinary';
import { AddItemButton } from '../../shared/components/AddItemButton.tsx';
import { FullscreenGallery } from '../../shared/components/FullscreenGallery';
import { Search, ChevronDown, ImageIcon, X, ArrowUp, ArrowDown, ShoppingBag, Package, ListFilter, Gift } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatCurrency, cn } from '../../shared/utils/utils';
import { motion, AnimatePresence } from 'motion/react';
import { FigureCard } from './components/FigureCard';
import { FigureModal } from './components/FigureModal';
import { DeleteFigureModal } from './components/DeleteFigureModal';

interface FigureForm {
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

type FilterType = 'all' | 'purchased' | 'gifted';
type SortField = 'characterName' | 'sourceAnime' | 'maker' | 'totalPrice';
type SortOrder = 'asc' | 'desc';

export function ActionFiguresPage() {
  const { user } = useAuth();
  const [figures, setFigures] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFigure, setEditingFigure] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayFigures, setDisplayFigures] = useState<any[]>([]);

  // Filtering & Sorting State
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalPrice');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [makersSuggestions, setMakersSuggestions] = useState<string[]>([]);
  const [animeSuggestions, setAnimeSuggestions] = useState<string[]>([]);
  const [imageItems, setImageItems] = useState<{ url: string; file?: File }[]>([]);
  const [showMakerSuggestions, setShowMakerSuggestions] = useState(false);
  const [showAnimeSuggestions, setShowAnimeSuggestions] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[] | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [figureToDelete, setFigureToDelete] = useState<any>(null);
  const [showSortControls, setShowSortControls] = useState(false);

  const purchasedBasePrice = figures.filter(f => !f.isGifted).reduce((sum, f) => sum + (f.totalPrice || 0), 0);
  const giftsBasePrice = figures.filter(f => f.isGifted).reduce((sum, f) => sum + (f.totalPrice || 0), 0);
  const totalBasePrice = figures.reduce((sum, f) => sum + (f.totalPrice || 0), 0);

  const totalPurchasedCount = figures.filter(f => !f.isGifted).length;
  const totalGiftsCount = figures.filter(f => f.isGifted).length;
  const totalFiguresCount = figures.length;

  useEffect(() => {
    if (initialLoading) return;
    
    setIsFiltering(true);
    const timer = setTimeout(() => {
      const results = figures
        .filter(figure => {
          if (activeFilter === 'gifted' && !figure.isGifted) return false;
          if (activeFilter === 'purchased' && figure.isGifted) return false;
          
          const searchLower = searchQuery.toLowerCase();
          return (
            figure.characterName.toLowerCase().includes(searchLower) ||
            figure.sourceAnime.toLowerCase().includes(searchLower) ||
            figure.maker.toLowerCase().includes(searchLower) ||
            (figure.figureLine && figure.figureLine.toLowerCase().includes(searchLower))
          );
        })
        .sort((a, b) => {
          let valA = a[sortField] ?? '';
          let valB = b[sortField] ?? '';
          
          if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
          }
          
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      
      setDisplayFigures(results);
      setIsFiltering(false);
    }, 400); // 400ms delay for smooth transition

    return () => clearTimeout(timer);
  }, [figures, activeFilter, searchQuery, sortField, sortOrder, initialLoading]);

  useEffect(() => {
    if (!user) return;
    setInitialLoading(true);
    const q = query(collection(db, 'actionFigures'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setFigures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setInitialLoading(false);
    });
  }, [user]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isModalOpen) {
        try {
          const makersSnap = await getDocs(collection(db, 'makers'));
          const animeSnap = await getDocs(collection(db, 'anime'));
          
          // Deduplicate suggestions (case-insensitive)
          const uniqueMakers = Array.from(new Set(makersSnap.docs.map(doc => doc.data().name.trim()))).filter(Boolean);
          const uniqueAnime = Array.from(new Set(animeSnap.docs.map(doc => doc.data().title.trim()))).filter(Boolean);
          
          setMakersSuggestions(uniqueMakers);
          setAnimeSuggestions(uniqueAnime);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      }
    };
    fetchSuggestions();
  }, [isModalOpen]);

  const formMethods = useForm<FigureForm>({
    mode: 'onChange'
  });
  const { register, handleSubmit, reset, setValue, watch, formState: { isValid } } = formMethods;
  const watchedMaker = watch('maker');
  const watchedAnime = watch('sourceAnime');
  const watchedImages = watch('images');
  const watchedIsSold = watch('isSold');
  const watchedIsLost = watch('isLost');

  useEffect(() => {
    if (watchedIsSold) {
      setValue('isLost', false);
    }
  }, [watchedIsSold, setValue]);

  useEffect(() => {
    if (watchedIsLost) {
      setValue('isSold', false);
    }
  }, [watchedIsLost, setValue]);

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
        await updateDoc(doc(db, 'actionFigures', editingFigure.id), figureData);
      } else {
        await addDoc(collection(db, 'actionFigures'), figureData);
      }

      // Sync Intellisense Collections (Case Insensitive)
      const makerExists = makersSuggestions.some(m => m.toLowerCase() === figureData.maker.toLowerCase());
      if (!makerExists && figureData.maker) {
        await addDoc(collection(db, 'makers'), { name: figureData.maker, addedBy: user.uid });
      }
      
      const animeExists = animeSuggestions.some(a => a.toLowerCase() === figureData.sourceAnime.toLowerCase());
      if (!animeExists && figureData.sourceAnime) {
        await addDoc(collection(db, 'anime'), { title: figureData.sourceAnime, addedBy: user.uid });
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

  const handleDelete = (figure: any) => {
    setFigureToDelete(figure);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!figureToDelete) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'actionFigures', figureToDelete.id));
      setIsDeleteModalOpen(false);
      setFigureToDelete(null);
    } catch (error) {
      console.error("Error deleting figure:", error);
    } finally {
      setLoading(false);
    }
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

  const abbreviateMaker = (maker: string) => {
    if (!maker) return '';
    const words = maker.trim().split(/\s+/);
    if (words.length > 1) {
      return words.map(word => word[0].toUpperCase()).join('');
    }
    return maker;
  };

  return (
    <div className="space-y-4">
      <div className="flex sticky top-[56px] md:top-0 z-30 bg-bg-deep/80 backdrop-blur-md py-4 justify-between items-end mb-4 transition-all">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-text-main uppercase tracking-tighter italic">Action Figures</h2>
          <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Catalog Archive</p>
        </div>
        <AddItemButton 
          onClick={() => { setEditingFigure(null); setImageItems([]); reset({ characterName: '', maker: '', figureLine: '', totalPrice: null, condition: 'MSIB', sourceAnime: '', isGifted: false, isSold: false, isLost: false, description: '' }); setIsModalOpen(true); }}
          label="Add New Figure"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { 
            id: 'all' as const, 
            label: "Figure Expenses", 
            mobileLabel: "Total",
            value: totalBasePrice, 
            extra: '',
            count: totalFiguresCount, 
            icon: Package, 
            activeColor: "bg-emerald-500/15",
            activeBorder: "border-emerald-500", 
            hoverBorder: "hover:border-accent-primary/50" 
          },
          { 
            id: 'purchased' as const, 
            label: "Total Purchased", 
            mobileLabel: "Purchased",
            value: purchasedBasePrice, 
            extra: '',
            count: totalPurchasedCount, 
            icon: ShoppingBag, 
            activeColor: "bg-emerald-500/15",
            activeBorder: "border-emerald-500", 
            hoverBorder: "hover:border-accent-primary/50" 
          },
          { 
            id: 'gifted' as const, 
            label: "Total Gifts", 
            mobileLabel: "Gifts",
            value: giftsBasePrice, 
            extra: '',
            count: totalGiftsCount, 
            icon: Gift, 
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
                  {formatCurrency(item.value)}
                </p>
                {item.extra && (
                  <span className={cn(
                    "text-[7px] sm:text-[10px] font-bold shrink-0",
                    activeFilter === item.id ? "text-accent-soft" : "text-accent-soft"
                  )}>
                    {item.extra}
                  </span>
                )}
              </div>
            </div>
            
            <p className={cn(
              "text-[7px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider mt-2 opacity-70",
              activeFilter === item.id ? "text-text-muted" : "text-text-muted"
            )}>
              {item.count} item{item.count !== 1 ? 's' : ''}
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
              placeholder="Search characters, series, makers..."
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
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl px-4 text-sm focus:ring-1 focus:ring-accent-primary outline-none appearance-none cursor-pointer pr-10 font-bold"
            >
              <option value="characterName">Character Name</option>
              <option value="sourceAnime">Source Series</option>
              <option value="maker">Maker</option>
              <option value="totalPrice">Price</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-12 w-12 flex items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl text-text-muted hover:text-accent-primary transition-colors shrink-0"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {initialLoading || isFiltering ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
            <LoadingSpinner variant="brand" />
            <p className="text-xs font-black uppercase tracking-widest italic animate-pulse">
              {initialLoading ? "Sourcing Archives..." : "Refining Catalog..."}
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
                abbreviateMaker={abbreviateMaker}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {!initialLoading && !isFiltering && displayFigures.length === 0 && (
        <div className="py-32 text-center text-text-muted italic opacity-50 surface-container">
          {figures.length === 0 
            ? "Your collection catalog is empty. Start by recording your first grail." 
            : "No figures match your search or filter."
          }
        </div>
      )}

      {/* Custom Fullscreen Gallery */}
      {selectedGalleryImages && (
        <FullscreenGallery 
          images={selectedGalleryImages}
          initialIndex={currentGalleryIndex}
          onClose={() => setSelectedGalleryImages(null)}
          accentColor="var(--color-accent-primary)"
        />
      )}

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

      <DeleteFigureModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        loading={loading}
        figureToDelete={figureToDelete}
        onConfirm={confirmDelete}
      />

      {/* removed loading screen overlay */}
    </div>
  );
}
