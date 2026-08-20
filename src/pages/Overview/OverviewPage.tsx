import { Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { formatCurrency, formatDateLong, formatMonthYear } from '../../shared/utils/utils';
import { motion } from 'motion/react';
import { TrendingUp, Package, Clock, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { PreorderCard } from '../Preorders/components/PreorderCard';
import { MarkReceivedModal } from '../Preorders/components/MarkReceivedModal';
import { FullscreenGallery } from '../../shared/components/FullscreenGallery';

export function OverviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [unreceivedPreorders, setUnreceivedPreorders] = useState<any[]>([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[] | null>(null);
  
  // Mark as received state
  const [isReceivedModalOpen, setIsReceivedModalOpen] = useState(false);
  const [preorderToMark, setPreorderToMark] = useState<any>(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedStatus, setReceivedStatus] = useState<string | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState(false);
  const [makersSuggestions, setMakersSuggestions] = useState<string[]>([]);
  const [animeSuggestions, setAnimeSuggestions] = useState<string[]>([]);

  const [stats, setStats] = useState({
    figures: 0,
    preorders: 0,
    equipment: 0,
    figureCost: 0,
    figureGiftedValue: 0,
    equipmentCost: 0,
  });

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const figuresQuery = query(collection(db, 'actionFigures'), where('userId', '==', user.uid));
    const preordersQuery = query(collection(db, 'preorders'), where('userId', '==', user.uid));
    const equipmentQuery = query(collection(db, 'equipments'), where('userId', '==', user.uid));

    let figuresLoaded = false;
    let preordersLoaded = false;
    let equipmentLoaded = false;

    const checkLoading = () => {
      if (figuresLoaded && preordersLoaded && equipmentLoaded) {
        setLoading(false);
      }
    };

    const unsubFigures = onSnapshot(figuresQuery, (snapshot) => {
      let purchasedCost = 0;
      let giftedValue = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isGifted) {
          giftedValue += data.totalPrice || 0;
        } else {
          purchasedCost += data.totalPrice || 0;
        }
      });
      setStats(prev => ({ 
        ...prev, 
        figures: snapshot.size, 
        figureCost: purchasedCost,
        figureGiftedValue: giftedValue 
      }));
      figuresLoaded = true;
      checkLoading();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'actionFigures');
      figuresLoaded = true;
      checkLoading();
    });

    const unsubPreorders = onSnapshot(preordersQuery, (snapshot) => {
      const activePreorders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((item: any) => !item.receivedAt)
        .sort((a: any, b: any) => {
          // Estimated arrival sorting (nearest first)
          const aDate = a.estimatedArrivalFrom || '9999-99';
          const bDate = b.estimatedArrivalFrom || '9999-99';
          if (!a.estimatedArrivalFrom && b.estimatedArrivalFrom) return 1;
          if (a.estimatedArrivalFrom && !b.estimatedArrivalFrom) return -1;
          return aDate.localeCompare(bDate);
        });

      setUnreceivedPreorders(activePreorders);
      setStats(prev => ({ ...prev, preorders: activePreorders.length }));
      preordersLoaded = true;
      checkLoading();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'preorders');
      preordersLoaded = true;
      checkLoading();
    });

    const unsubEquipment = onSnapshot(equipmentQuery, (snapshot) => {
      let cost = 0;
      snapshot.docs.forEach(doc => {
        cost += doc.data().totalPrice || 0;
      });
      setStats(prev => ({ ...prev, equipment: snapshot.size, equipmentCost: cost }));
      equipmentLoaded = true;
      checkLoading();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'equipments');
      equipmentLoaded = true;
      checkLoading();
    });

    return () => {
      unsubFigures();
      unsubPreorders();
      unsubEquipment();
    };
  }, [user]);

  // Fetch suggestions when mark received modal opens
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isReceivedModalOpen) {
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
          console.error("Error fetching suggestions:", error);
        }
      }
    };
    fetchSuggestions();
  }, [isReceivedModalOpen]);

  const confirmReceived = async () => {
    if (!preorderToMark || !user) return;
    setActionLoading(true);
    setReceivedStatus('Marking preorder as received...');
    try {
      // 1. Update Preorder in Firestore
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
      
      setTimeout(() => {
        setIsReceivedModalOpen(false);
        setPreorderToMark(null);
        setReceivedStatus(undefined);
      }, 1500);

    } catch (error) {
      console.error("Error marking as received:", error);
      setReceivedStatus('Error encountered during check-in.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalOverallValue = stats.figureCost + stats.figureGiftedValue + stats.equipmentCost;

  const totalAmountToPay = useMemo(() => {
    return unreceivedPreorders.reduce((sum, item) => {
      const price = Number(item.preorderPrice) || 0;
      const dp = Number(item.downpayment) || 0;
      return sum + (price - dp);
    }, 0);
  }, [unreceivedPreorders]);

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-[56px] md:top-0 z-30 bg-bg-deep/80 backdrop-blur-md py-4 transition-all"
      >
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-main uppercase">
          WELCOME, <span className="text-accent-primary">COLLECTOR.</span>
        </h2>
        <p className="text-text-muted text-[10px] sm:text-xs mt-1 font-medium tracking-wide uppercase">
          Your Gallery thrives. <span className="text-accent-soft">{stats.preorders} preorder{stats.preorders !== 1 ? 's' : ''}</span> {stats.preorders !== 1 ? 'are' : 'is'} on the horizon.
        </p>
      </motion.header>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { icon: TrendingUp, label: "Total", value: totalOverallValue, sub: `overall value` },
          { 
            icon: Package, 
            label: "Figures", 
            value: stats.figureCost, 
            giftedValue: stats.figureGiftedValue,
            sub: `${stats.figures} items` 
          },
          { icon: Shield, label: "Equipment", value: stats.equipmentCost, sub: `${stats.equipment} units` }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-sophisticated p-2 sm:p-4 group cursor-default h-full flex flex-col justify-between"
          >
            <div>
              <div className="text-[7px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-text-muted mb-2 font-black flex items-center gap-1 sm:gap-2">
                <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-accent-primary/5 flex items-center justify-center group-hover:bg-accent-primary group-hover:text-white transition-all duration-300 shrink-0">
                  <item.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="truncate">
                  {item.label === "Total" ? "OVERALL TOTAL" : (
                    <>
                      {item.label}
                      <span className="hidden sm:inline"> Expenses</span>
                    </>
                  )}
                </span>
              </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <p className="text-xs sm:text-lg lg:text-xl font-black text-text-main tracking-tighter truncate">
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin inline-block align-middle" />
                    ) : (
                      formatCurrency(item.value)
                    )}
                  </p>
                  {'giftedValue' in item && item.giftedValue! > 0 && (
                    <div className="flex items-center gap-0.5 text-emerald-500 font-bold shrink-0">
                      <span className="text-[8px] sm:text-[10px] uppercase tracking-tighter sm:tracking-normal">
                        (+{formatCurrency(item.giftedValue!).replace('$', '')})
                      </span>
                    </div>
                  )}
                </div>
            </div>
            <p className="text-[7px] sm:text-[10px] text-text-muted mt-2 font-semibold uppercase tracking-tight sm:tracking-wider truncate">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Public Showcase Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-red rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/20">
            <Clock className="text-white w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-text-main tracking-tight uppercase">Public Showcase</h4>
            <p className="text-xs text-text-muted font-medium">Your curated Gallery is broadcasting to the world.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            to="/dashboard/showcase"
            className="w-full sm:w-auto px-6 py-2 bg-accent-primary text-white border border-accent-primary rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 text-center"
          >
            Manage Showcases
          </Link>
          <a 
            href={`/publicshowcase/${user?.uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-2 bg-bg-card hover:bg-accent-primary hover:text-white border border-border-subtle rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 text-center"
          >
            View Exhibition Archive
          </a>
        </div>
      </motion.div>

      {/* Unreceived Preorders Section (Below Public Showcase) */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h3 className="text-sm sm:text-base font-black text-text-main uppercase tracking-tight">
                  Pending Preorders
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-accent-primary/10 text-accent-primary border border-accent-primary/20 uppercase tracking-wider">
                  {unreceivedPreorders.length}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1 bg-bg-surface px-2.5 py-0.5 rounded-lg border border-border-subtle/80">
                  Total Amount to Pay: <span className="font-black text-accent-soft">{formatCurrency(totalAmountToPay)}</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-text-muted font-medium uppercase tracking-wide mt-0.5">
                Figures in transit & awaiting fulfillment
              </p>
            </div>
          </div>

          <Link
            to="/dashboard/preorders"
            className="text-[10px] sm:text-xs font-black text-accent-primary hover:text-accent-soft flex items-center gap-1.5 uppercase tracking-widest transition-colors shrink-0 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="card-sophisticated p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : unreceivedPreorders.length === 0 ? (
          <div className="card-sophisticated p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-primary/5 border border-accent-primary/10 flex items-center justify-center text-text-muted">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main uppercase tracking-tight">No Pending Preorders</p>
              <p className="text-xs text-text-muted mt-1">All ordered figures have arrived or none are recorded yet.</p>
            </div>
            <Link
              to="/dashboard/preorders"
              className="mt-2 px-4 py-2 bg-accent-primary text-white hover:bg-accent-soft rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Add New Preorder
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {unreceivedPreorders.map((preorder) => (
              <PreorderCard
                key={preorder.id}
                preorder={preorder}
                onMarkReceived={(p) => {
                  setPreorderToMark(p);
                  setReceivedDate(new Date().toISOString().split('T')[0]);
                  setIsReceivedModalOpen(true);
                }}
                onViewGallery={(images) => {
                  setSelectedGalleryImages(images);
                }}
                formatDateLong={formatDateLong}
                formatMonthYear={formatMonthYear}
              />
            ))}
          </div>
        )}
      </motion.section>

      {/* Fullscreen Image Gallery */}
      {selectedGalleryImages && selectedGalleryImages.length > 0 && (
        <FullscreenGallery
          images={selectedGalleryImages}
          onClose={() => setSelectedGalleryImages(null)}
        />
      )}

      {/* Mark as Received Modal */}
      <MarkReceivedModal
        isOpen={isReceivedModalOpen}
        onClose={() => {
          if (!actionLoading) {
            setIsReceivedModalOpen(false);
            setPreorderToMark(null);
            setReceivedStatus(undefined);
          }
        }}
        loading={actionLoading}
        preorderToMark={preorderToMark}
        receivedDate={receivedDate}
        setReceivedDate={setReceivedDate}
        onConfirm={confirmReceived}
        status={receivedStatus}
      />
    </div>
  );
}
