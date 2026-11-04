import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { motion } from 'motion/react';
import { MarkReceivedModal } from '../Preorders/components/MarkReceivedModal';
import { FullscreenGallery } from '../../shared/components/FullscreenGallery';

// Subcomponents
import { OverviewMetrics } from './components/OverviewMetrics';
import { ShowcaseBanner } from './components/ShowcaseBanner';
import { OverviewPendingPreorders } from './components/OverviewPendingPreorders';

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

    // If unauthenticated with Firebase Auth (e.g. custom auth without active cloud session),
    // load directly from local cache to prevent permission rejections
    if (!auth.currentUser) {
      try {
        const localFigures = JSON.parse(localStorage.getItem('kuradex_figures_' + user.uid) || '[]');
        const localPreorders = JSON.parse(localStorage.getItem('kuradex_preorders_' + user.uid) || '[]');
        const localEquipment = JSON.parse(localStorage.getItem('kuradex_equipments_' + user.uid) || '[]');

        let purchasedCost = 0;
        let giftedValue = 0;
        localFigures.forEach((data: any) => {
          if (data.isGifted) {
            giftedValue += data.totalPrice || 0;
          } else {
            purchasedCost += data.totalPrice || 0;
          }
        });

        const activePreorders = localPreorders
          .filter((item: any) => !item.receivedAt)
          .sort((a: any, b: any) => {
            const aDate = a.estimatedArrivalFrom || '9999-99';
            const bDate = b.estimatedArrivalFrom || '9999-99';
            if (!a.estimatedArrivalFrom && b.estimatedArrivalFrom) return 1;
            if (a.estimatedArrivalFrom && !b.estimatedArrivalFrom) return -1;
            return aDate.localeCompare(bDate);
          });

        let eqCost = 0;
        localEquipment.forEach((doc: any) => {
          eqCost += doc.totalPrice || 0;
        });

        setStats({
          figures: localFigures.length,
          figureCost: purchasedCost,
          figureGiftedValue: giftedValue,
          preorders: activePreorders.length,
          equipment: localEquipment.length,
          equipmentCost: eqCost,
        });
        setUnreceivedPreorders(activePreorders);
      } catch {
        // fallback
      }
      setLoading(false);
      return;
    }

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

    const unsubFigures = onSnapshot(
      figuresQuery,
      (snapshot) => {
        let purchasedCost = 0;
        let giftedValue = 0;
        const loadedFigures = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        localStorage.setItem('kuradex_figures_' + user.uid, JSON.stringify(loadedFigures));

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.isGifted) {
            giftedValue += data.totalPrice || 0;
          } else {
            purchasedCost += data.totalPrice || 0;
          }
        });
        setStats((prev) => ({
          ...prev,
          figures: snapshot.size,
          figureCost: purchasedCost,
          figureGiftedValue: giftedValue,
        }));
        figuresLoaded = true;
        checkLoading();
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'actionFigures');
        } catch {
          // Prevent uncaught stream error
        }
        figuresLoaded = true;
        checkLoading();
      }
    );

    const unsubPreorders = onSnapshot(
      preordersQuery,
      (snapshot) => {
        const activePreorders = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => !item.receivedAt)
          .sort((a: any, b: any) => {
            const aDate = a.estimatedArrivalFrom || '9999-99';
            const bDate = b.estimatedArrivalFrom || '9999-99';
            if (!a.estimatedArrivalFrom && b.estimatedArrivalFrom) return 1;
            if (a.estimatedArrivalFrom && !b.estimatedArrivalFrom) return -1;
            return aDate.localeCompare(bDate);
          });

        const allPreorders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem('kuradex_preorders_' + user.uid, JSON.stringify(allPreorders));

        setUnreceivedPreorders(activePreorders);
        setStats((prev) => ({ ...prev, preorders: activePreorders.length }));
        preordersLoaded = true;
        checkLoading();
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'preorders');
        } catch {
          // Prevent uncaught stream error
        }
        preordersLoaded = true;
        checkLoading();
      }
    );

    const unsubEquipment = onSnapshot(
      equipmentQuery,
      (snapshot) => {
        let cost = 0;
        const allEquip = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem('kuradex_equipments_' + user.uid, JSON.stringify(allEquip));

        snapshot.docs.forEach((doc) => {
          cost += doc.data().totalPrice || 0;
        });
        setStats((prev) => ({ ...prev, equipment: snapshot.size, equipmentCost: cost }));
        equipmentLoaded = true;
        checkLoading();
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'equipments');
        } catch {
          // Prevent uncaught stream error
        }
        equipmentLoaded = true;
        checkLoading();
      }
    );

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
        if (!auth.currentUser) {
          try {
            const localFigs = JSON.parse(localStorage.getItem('kuradex_figures_' + user?.uid) || '[]');
            const uniqueMakers = Array.from(new Set(localFigs.map((f: any) => f.maker?.trim()))).filter(Boolean);
            const uniqueAnime = Array.from(new Set(localFigs.map((f: any) => f.sourceAnime?.trim()))).filter(Boolean);
            setMakersSuggestions(uniqueMakers as string[]);
            setAnimeSuggestions(uniqueAnime as string[]);
          } catch {
            // fallback
          }
          return;
        }

        try {
          const makersSnap = await getDocs(collection(db, 'makers')).catch((err) => {
            try { handleFirestoreError(err, OperationType.GET, 'makers'); } catch {}
            return { docs: [] } as any;
          });
          const animeSnap = await getDocs(collection(db, 'anime')).catch((err) => {
            try { handleFirestoreError(err, OperationType.GET, 'anime'); } catch {}
            return { docs: [] } as any;
          });

          const uniqueMakers = Array.from(new Set(makersSnap.docs.map((doc: any) => doc.data().name?.trim()))).filter(Boolean);
          const uniqueAnime = Array.from(new Set(animeSnap.docs.map((doc: any) => doc.data().title?.trim()))).filter(Boolean);

          setMakersSuggestions(uniqueMakers as string[]);
          setAnimeSuggestions(uniqueAnime as string[]);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }
    };
    fetchSuggestions();
  }, [isReceivedModalOpen, user?.uid]);

  const confirmReceived = async () => {
    if (!preorderToMark || !user) return;
    setActionLoading(true);
    setReceivedStatus('Marking preorder as received...');
    try {
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

      if (auth.currentUser) {
        await updateDoc(doc(db, 'preorders', preorderToMark.id), {
          receivedAt: receivedDate,
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `preorders/${preorderToMark.id}`);
          throw err;
        });

        setReceivedStatus('Adding to Action Figure catalog...');

        await addDoc(collection(db, 'actionFigures'), figureData).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, 'actionFigures');
          throw err;
        });

        if (figureData.maker) {
          const makerExists = makersSuggestions.some((m) => m.toLowerCase() === figureData.maker.toLowerCase());
          if (!makerExists) {
            await addDoc(collection(db, 'makers'), { name: figureData.maker, addedBy: user.uid }).catch((err) => {
              try { handleFirestoreError(err, OperationType.CREATE, 'makers'); } catch {}
            });
          }
        }

        if (figureData.sourceAnime) {
          const animeExists = animeSuggestions.some((a) => a.toLowerCase() === figureData.sourceAnime.toLowerCase());
          if (!animeExists) {
            await addDoc(collection(db, 'anime'), { title: figureData.sourceAnime, addedBy: user.uid }).catch((err) => {
              try { handleFirestoreError(err, OperationType.CREATE, 'anime'); } catch {}
            });
          }
        }
      }

      // Update local storage data
      try {
        const localPreorders = JSON.parse(localStorage.getItem('kuradex_preorders_' + user.uid) || '[]');
        const updatedPreorders = localPreorders.map((p: any) =>
          p.id === preorderToMark.id ? { ...p, receivedAt: receivedDate } : p
        );
        localStorage.setItem('kuradex_preorders_' + user.uid, JSON.stringify(updatedPreorders));

        const localFigures = JSON.parse(localStorage.getItem('kuradex_figures_' + user.uid) || '[]');
        localFigures.unshift({
          id: `fig_${Date.now()}`,
          ...figureData,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('kuradex_figures_' + user.uid, JSON.stringify(localFigures));

        // Update local state if not streaming from Firestore
        if (!auth.currentUser) {
          setUnreceivedPreorders((prev) => prev.filter((p) => p.id !== preorderToMark.id));
          setStats((prev) => ({
            ...prev,
            figures: prev.figures + 1,
            figureCost: prev.figureCost + figureData.totalPrice,
            preorders: Math.max(0, prev.preorders - 1),
          }));
        }
      } catch {
        // ignore
      }

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
      setActionLoading(false);
    }
  };

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
          Your Gallery thrives.{' '}
          <span className="text-accent-soft">
            {stats.preorders} preorder{stats.preorders !== 1 ? 's' : ''}
          </span>{' '}
          {stats.preorders !== 1 ? 'are' : 'is'} on the horizon.
        </p>
      </motion.header>

      {/* Top Overview Metrics */}
      <OverviewMetrics
        loading={loading}
        figureCost={stats.figureCost}
        figureGiftedValue={stats.figureGiftedValue}
        figureCount={stats.figures}
        equipmentCost={stats.equipmentCost}
        equipmentCount={stats.equipment}
      />

      {/* Public Showcase Banner */}
      <ShowcaseBanner userId={user?.uid} />

      {/* Pending Preorders Section */}
      <OverviewPendingPreorders
        loading={loading}
        unreceivedPreorders={unreceivedPreorders}
        totalAmountToPay={totalAmountToPay}
        onMarkReceived={(p) => {
          setPreorderToMark(p);
          setReceivedDate(new Date().toISOString().split('T')[0]);
          setIsReceivedModalOpen(true);
        }}
        onViewGallery={(images) => {
          setSelectedGalleryImages(images);
        }}
      />

      {/* Fullscreen Image Gallery */}
      {selectedGalleryImages && selectedGalleryImages.length > 0 && (
        <FullscreenGallery images={selectedGalleryImages} onClose={() => setSelectedGalleryImages(null)} />
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
